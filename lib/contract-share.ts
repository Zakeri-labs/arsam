import { createHmac, timingSafeEqual } from 'crypto';

// Public "download this contract" links: `<base64url contract id>.<HMAC>`.
// The HMAC uses SESSION_SECRET with its own purpose prefix, so a link can only
// be minted by the server and only ever opens the one contract it names.
// Server-only (uses the session secret).

const PURPOSE = 'contract-share:';
const MIN_SECRET_LENGTH = 32;

function secret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

function sign(contractId: string, key: string): string {
  return createHmac('sha256', key).update(PURPOSE + contractId).digest('base64url').slice(0, 32);
}

export function createContractShareToken(contractId: string): string | null {
  const key = secret();
  if (!key || !contractId) return null;
  return `${Buffer.from(contractId, 'utf8').toString('base64url')}.${sign(contractId, key)}`;
}

/** Returns the contract id the token was issued for, or null when it is forged or malformed. */
export function readContractShareToken(token: string | undefined | null): string | null {
  const key = secret();
  if (!key || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  let contractId: string;
  try {
    contractId = Buffer.from(parts[0], 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!contractId) return null;
  const expected = Buffer.from(sign(contractId, key));
  const given = Buffer.from(parts[1]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return contractId;
}
