import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const BENEFICIARY_PROOF_COOKIE = 'atomcare-beneficiary-proof';
export const BENEFICIARY_PROOF_TTL_SECONDS = 10 * 60;

type BeneficiaryIdentity = {
  recognitionNumber: string;
  birthDate: string;
  validFrom: string;
};

function integrationSecret() {
  const secret = process.env.BENEFICIARY_INTEGRATION_SECRET?.trim();
  if (!secret) throw new Error('BENEFICIARY_INTEGRATION_SECRET is not configured.');
  return secret;
}

function normalizedIdentity(identity: BeneficiaryIdentity) {
  return [
    identity.recognitionNumber.replace(/\D/g, ''),
    identity.birthDate.trim(),
    identity.validFrom.trim(),
  ].join('|');
}

function identityHash(identity: BeneficiaryIdentity) {
  return createHash('sha256')
    .update(normalizedIdentity(identity))
    .digest('base64url');
}

function equalText(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createBeneficiaryProof(identity: BeneficiaryIdentity) {
  const expiresAt = Math.floor(Date.now() / 1000) + BENEFICIARY_PROOF_TTL_SECONDS;
  const hash = identityHash(identity);
  const payload = `${expiresAt}.${hash}`;
  const signature = createHmac('sha256', integrationSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function verifyBeneficiaryProof(
  token: string | undefined,
  identity: BeneficiaryIdentity,
) {
  if (!token) return false;

  const [expiresText, storedHash, suppliedSignature, ...rest] = token.split('.');
  if (!expiresText || !storedHash || !suppliedSignature || rest.length > 0) return false;

  const expiresAt = Number(expiresText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(expiresAt) || expiresAt <= now) return false;
  if (expiresAt > now + BENEFICIARY_PROOF_TTL_SECONDS + 60) return false;

  const expectedHash = identityHash(identity);
  if (!equalText(storedHash, expectedHash)) return false;

  const payload = `${expiresText}.${storedHash}`;
  const expectedSignature = createHmac('sha256', integrationSecret())
    .update(payload)
    .digest('base64url');

  return equalText(suppliedSignature, expectedSignature);
}
