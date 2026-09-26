// Server-only admin account registry.
//
// Two kinds of accounts:
//  * The built-in general manager account (below). Its password comes
//    exclusively from the environment; if the variable is unset (or too short)
//    it cannot log in at all. It cannot be edited or removed from the panel, so
//    nobody can lock the general manager out.
//  * (The fleet manager used to be built in as well; supabase_migration_admin_users_fleet_manager.sql
//    moves him into the staff table so his sections can be managed from the panel.)
//  * Staff accounts — created by the general manager in the panel's access
//    management screen and stored in `public.admin_users` with a scrypt
//    password hash. Their sections are re-read from the database on every
//    request, so a change or deactivation applies immediately.

import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';
import { supabase } from './supabase';

if (typeof window !== 'undefined') {
  throw new Error('lib/admin-users must never be imported in the browser');
}

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

export type AdminScreen = 'services' | 'requests' | 'qms' | 'customers' | 'cars';
export const ADMIN_SCREENS: AdminScreen[] = ['services', 'requests', 'qms', 'customers', 'cars'];

export interface AdminUserSession {
  email: string;
  name: string;
  role: 'superadmin' | 'cars_only' | 'staff';
  allowedScreens: AdminScreen[];
}

/** A staff account as shown in the access management screen (never includes the hash). */
export interface StaffAccount {
  id: string;
  email: string;
  name: string;
  allowedScreens: AdminScreen[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BuiltInAccount extends AdminUserSession {
  passwordEnv: string;
}

export const MIN_PASSWORD_LENGTH = 10;

const BUILT_IN_ACCOUNTS: BuiltInAccount[] = [
  {
    email: 'r.amareh@yahoo.com',
    passwordEnv: 'ADMIN_PASSWORD',
    name: 'رضا اماره (مدیر کل)',
    role: 'superadmin',
    allowedScreens: ['services', 'requests', 'qms', 'customers', 'cars'],
  },
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function findBuiltIn(email: string): BuiltInAccount | undefined {
  const clean = normalizeEmail(email);
  return BUILT_IN_ACCOUNTS.find(a => a.email.toLowerCase() === clean);
}

export function isBuiltInEmail(email: string): boolean {
  return !!findBuiltIn(email);
}

/** Built-in accounts for display in the access screen (no secrets). */
export function listBuiltInAccounts(): AdminUserSession[] {
  return BUILT_IN_ACCOUNTS.map(({ passwordEnv: _p, ...a }) => ({ ...a, allowedScreens: [...a.allowedScreens] }));
}

function builtInPassword(account: BuiltInAccount): string | null {
  const password = process.env[account.passwordEnv];
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    console.error(`${account.passwordEnv} is not set or shorter than ${MIN_PASSWORD_LENGTH} characters; login disabled for this account.`);
    return null;
  }
  return password;
}

// --- Password hashing (scrypt) ---------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// A staff row may hold `env:<VARIABLE>` instead of a hash: the password is then
// read from that environment variable. Used to move the fleet manager from a
// built-in account into the staff table without changing his password; the
// first password reset from the panel replaces the marker with a real hash.
const ENV_PASSWORD_MARKER = /^env:([A-Z_]+)$/;

async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  const envMarker = stored.match(ENV_PASSWORD_MARKER);
  if (envMarker) {
    const expected = process.env[envMarker[1]];
    if (!expected || expected.length < MIN_PASSWORD_LENGTH) return false;
    return plainPasswordsMatch(password, expected);
  }

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n), r: Number(r), p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Hash both sides to equal length so the comparison is constant-time.
function plainPasswordsMatch(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

// A fixed dummy hash so a login for an unknown email costs the same as a real one.
let dummyHash: Promise<string> | null = null;

// --- Staff accounts (database) ----------------------------------------------

interface StaffRow {
  id: string;
  email: string;
  name: string;
  allowed_screens: string[] | null;
  password_hash: string;
  session_version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const sanitizeScreens = (screens: unknown): AdminScreen[] =>
  Array.isArray(screens) ? ADMIN_SCREENS.filter(s => screens.includes(s)) : [];

function rowToStaff(row: StaffRow): StaffAccount {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    allowedScreens: sanitizeScreens(row.allowed_screens),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSession(row: StaffRow): AdminUserSession {
  return { email: row.email, name: row.name, role: 'staff', allowedScreens: sanitizeScreens(row.allowed_screens) };
}

async function findStaffRow(email: string): Promise<StaffRow | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  if (error) {
    console.error('Failed to read admin_users:', error.message);
    return null;
  }
  return (data as StaffRow) || null;
}

// --- Authentication ---------------------------------------------------------

/**
 * Checks an email/password pair. Returns the session user and the session
 * version to embed in the cookie, or null when the credentials are wrong.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ user: AdminUserSession; sessionVersion: number } | null> {
  const builtIn = findBuiltIn(email);
  if (builtIn) {
    const expected = builtInPassword(builtIn);
    const ok = plainPasswordsMatch(password, expected ?? 'no-account-placeholder') && !!expected;
    if (!ok) return null;
    const { passwordEnv: _p, ...user } = builtIn;
    return { user: { ...user, allowedScreens: [...user.allowedScreens] }, sessionVersion: 0 };
  }

  const row = await findStaffRow(email);
  if (!row || !row.is_active) {
    dummyHash ??= hashPassword('no-account-placeholder');
    await verifyPasswordHash(password, await dummyHash);
    return null;
  }
  if (!(await verifyPasswordHash(password, row.password_hash))) return null;
  return { user: rowToSession(row), sessionVersion: row.session_version };
}

/**
 * Resolves the account behind a (signature-checked) session. Staff sessions are
 * rejected once the account is deactivated, deleted, or its password reset.
 */
export async function resolveSessionUser(email: string, sessionVersion: number): Promise<AdminUserSession | null> {
  const builtIn = findBuiltIn(email);
  if (builtIn) {
    const { passwordEnv: _p, ...user } = builtIn;
    return { ...user, allowedScreens: [...user.allowedScreens] };
  }
  const row = await findStaffRow(email);
  if (!row || !row.is_active || row.session_version !== sessionVersion) return null;
  return rowToSession(row);
}

// --- Staff management (general manager only; enforced by the API route) ------

export class AccountError extends Error {}

function validateEmail(email: unknown): string {
  const clean = typeof email === 'string' ? normalizeEmail(email) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 254) {
    throw new AccountError('ایمیل معتبر نیست.');
  }
  return clean;
}

function validateName(name: unknown): string {
  const clean = typeof name === 'string' ? name.trim() : '';
  if (!clean || clean.length > 100) throw new AccountError('نام کاربر الزامی است (حداکثر ۱۰۰ کاراکتر).');
  return clean;
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 200) {
    throw new AccountError(`رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.`);
  }
  return password;
}

function validateScreens(screens: unknown): AdminScreen[] {
  const clean = sanitizeScreens(screens);
  if (clean.length === 0) throw new AccountError('حداقل یک بخش را برای دسترسی انتخاب کنید.');
  return clean;
}

export async function listStaffAccounts(): Promise<StaffAccount[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, name, allowed_screens, is_active, created_at, updated_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as StaffRow[]).map(rowToStaff);
}

export async function createStaffAccount(input: {
  email: unknown; name: unknown; password: unknown; allowedScreens: unknown;
}, createdBy: string): Promise<StaffAccount> {
  const email = validateEmail(input.email);
  if (isBuiltInEmail(email)) throw new AccountError('این ایمیل متعلق به یکی از حساب‌های اصلی است.');
  const name = validateName(input.name);
  const password = validatePassword(input.password);
  const allowedScreens = validateScreens(input.allowedScreens);

  const { data, error } = await supabase
    .from('admin_users')
    .insert([{
      email,
      name,
      allowed_screens: allowedScreens,
      password_hash: await hashPassword(password),
      created_by: createdBy,
    }])
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new AccountError('کاربری با این ایمیل از قبل وجود دارد.');
    throw error;
  }
  return rowToStaff(data as StaffRow);
}

export async function updateStaffAccount(id: string, input: {
  name?: unknown; allowedScreens?: unknown; isActive?: unknown; password?: unknown;
}): Promise<StaffAccount> {
  const { data: current, error: readError } = await supabase
    .from('admin_users').select('*').eq('id', id).maybeSingle();
  if (readError) throw readError;
  if (!current) throw new AccountError('کاربر یافت نشد.');

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = validateName(input.name);
  if (input.allowedScreens !== undefined) patch.allowed_screens = validateScreens(input.allowedScreens);
  if (input.isActive !== undefined) patch.is_active = input.isActive === true;
  if (input.password !== undefined) {
    patch.password_hash = await hashPassword(validatePassword(input.password));
    // Logs the user out everywhere: existing cookies carry the old version.
    patch.session_version = (current as StaffRow).session_version + 1;
  }

  const { data, error } = await supabase
    .from('admin_users').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToStaff(data as StaffRow);
}

export async function deleteStaffAccount(id: string): Promise<void> {
  const { data, error } = await supabase.from('admin_users').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new AccountError('کاربر یافت نشد.');
}
