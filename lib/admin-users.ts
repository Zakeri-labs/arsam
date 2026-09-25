// Server-only admin account registry. Passwords come exclusively from the
// environment — there are no fallback passwords in code. An account whose
// password variable is unset (or too short) cannot log in at all.

if (typeof window !== 'undefined') {
  throw new Error('lib/admin-users must never be imported in the browser');
}

export type AdminScreen = 'services' | 'requests' | 'qms' | 'customers' | 'cars';

export interface AdminUserSession {
  email: string;
  name: string;
  role: 'superadmin' | 'cars_only';
  allowedScreens: AdminScreen[];
}

interface AdminAccount extends AdminUserSession {
  passwordEnv: string;
}

const MIN_PASSWORD_LENGTH = 12;

const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    email: 'r.amareh@yahoo.com',
    passwordEnv: 'ADMIN_PASSWORD',
    name: 'رضا اماره (مدیر کل)',
    role: 'superadmin',
    allowedScreens: ['services', 'requests', 'qms', 'customers', 'cars'],
  },
  {
    email: 'b.mohammadi.d@gmail.com',
    passwordEnv: 'CAR_ADMIN_PASSWORD',
    name: 'محمدی (مدیر ناوگان خودروها)',
    role: 'cars_only',
    allowedScreens: ['cars'],
  },
];

function toSession(account: AdminAccount): AdminUserSession {
  return {
    email: account.email,
    name: account.name,
    role: account.role,
    allowedScreens: [...account.allowedScreens],
  };
}

export function findAdminByEmail(email: string): AdminUserSession | null {
  const clean = email.trim().toLowerCase();
  const account = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === clean);
  return account ? toSession(account) : null;
}

/** The configured password for an account, or null if it is missing/too weak to be accepted. */
export function getAdminPassword(email: string): string | null {
  const clean = email.trim().toLowerCase();
  const account = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === clean);
  if (!account) return null;
  const password = process.env[account.passwordEnv];
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    console.error(`${account.passwordEnv} is not set or shorter than ${MIN_PASSWORD_LENGTH} characters; login disabled for this account.`);
    return null;
  }
  return password;
}
