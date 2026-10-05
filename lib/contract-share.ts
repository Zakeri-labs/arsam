import { createHmac, timingSafeEqual } from 'crypto';

// Public "download this contract" links: `<base64url contract id>.<version>.<expiry>.<HMAC>`.
// The HMAC uses SESSION_SECRET with its own purpose prefix, so a link can only be minted by the
// server and only ever opens the one contract it names. The expiry (unix seconds) is signed
// inside the token, and the version must match the contract's `share_version` in the database:
// bumping that number ("revoke link") kills every link issued before.
// Server-only (uses the session secret).

const PURPOSE = 'contract-share:';
const MIN_SECRET_LENGTH = 32;
export const SHARE_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

function sign(contractId: string, version: number, expires: number, key: string): string {
  return createHmac('sha256', key).update(`${PURPOSE}${contractId}|${version}|${expires}`).digest('base64url').slice(0, 32);
}

export function createContractShareToken(contractId: string, version = 1): string | null {
  const key = secret();
  if (!key || !contractId) return null;
  const expires = Math.floor(Date.now() / 1000) + SHARE_LINK_TTL_SECONDS;
  return `${Buffer.from(contractId, 'utf8').toString('base64url')}.${version}.${expires}.${sign(contractId, version, expires, key)}`;
}

export type ShareTokenResult =
  | { status: 'ok'; contractId: string; version: number }
  | { status: 'expired'; contractId: string; version: number }
  | { status: 'invalid' };

/** Verifies the signature and expiry. The caller must still compare `version` with the contract's share_version. */
export function readContractShareToken(token: string | undefined | null): ShareTokenResult {
  const invalid: ShareTokenResult = { status: 'invalid' };
  const key = secret();
  if (!key || !token) return invalid;
  const parts = token.split('.');
  if (parts.length !== 4) return invalid;
  let contractId: string;
  try {
    contractId = Buffer.from(parts[0], 'base64url').toString('utf8');
  } catch {
    return invalid;
  }
  const version = Number(parts[1]);
  const expires = Number(parts[2]);
  if (!contractId || !Number.isInteger(version) || version < 1 || !Number.isInteger(expires)) return invalid;
  const expected = Buffer.from(sign(contractId, version, expires, key));
  const given = Buffer.from(parts[3]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return invalid;
  return { status: expires < Date.now() / 1000 ? 'expired' : 'ok', contractId, version };
}
