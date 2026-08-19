import {
  SignJWT,
  decodeJwt,
  decodeProtectedHeader,
  importPKCS8,
  importSPKI,
  jwtVerify,
  errors as joseErrors,
  type JWTHeaderParameters,
  type JWTPayload,
} from "jose";

export const HMAC_ALGORITHMS = ["HS256", "HS384", "HS512"] as const;
export const RSA_ALGORITHMS = ["RS256", "RS384", "RS512"] as const;
export const EC_ALGORITHMS = ["ES256", "ES384", "ES512"] as const;
export const SUPPORTED_ALGORITHMS = [...HMAC_ALGORITHMS, ...RSA_ALGORITHMS, ...EC_ALGORITHMS] as const;
export type JwtAlgorithm = (typeof SUPPORTED_ALGORITHMS)[number];

export function isHmacAlgorithm(alg: string): boolean {
  return (HMAC_ALGORITHMS as readonly string[]).includes(alg);
}

export function isSupportedAlgorithm(alg: string): alg is JwtAlgorithm {
  return (SUPPORTED_ALGORITHMS as readonly string[]).includes(alg);
}

export interface JwtParts {
  headerSegment: string;
  payloadSegment: string;
  signatureSegment: string;
}

export function splitJwt(token: string): JwtParts {
  const segments = token.trim().split(".");
  if (segments.length !== 3) {
    throw new Error("A JWT must have three dot-separated segments (header.payload.signature).");
  }
  const [headerSegment, payloadSegment, signatureSegment] = segments;
  return { headerSegment, payloadSegment, signatureSegment };
}

export interface ClaimInfo {
  key: string;
  description?: string;
  display: string;
  copyValue: string;
}

const CLAIM_DESCRIPTIONS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expiration time",
  nbf: "Not before",
  iat: "Issued at",
  jti: "JWT ID",
  alg: "Algorithm",
  typ: "Type",
  kid: "Key ID",
  cty: "Content type",
  scope: "Scope",
  scp: "Scope",
  azp: "Authorized party",
  email: "Email address",
  email_verified: "Email verified",
  name: "Full name",
  given_name: "First name",
  family_name: "Last name",
  preferred_username: "Preferred username",
  roles: "Roles",
  role: "Role",
  permissions: "Permissions",
};

export interface DecodedJwt {
  header: JWTHeaderParameters;
  payload: JWTPayload;
  parts: JwtParts;
  headerClaims: ClaimInfo[];
  payloadClaims: ClaimInfo[];
}

const RELATIVE_TIME_UNITS = [
  { limitSeconds: 60, divisor: 1, name: "second" },
  { limitSeconds: 3600, divisor: 60, name: "minute" },
  { limitSeconds: 86400, divisor: 3600, name: "hour" },
  { limitSeconds: 2592000, divisor: 86400, name: "day" },
  { limitSeconds: 31536000, divisor: 2592000, name: "month" },
  { limitSeconds: Infinity, divisor: 31536000, name: "year" },
];

function formatRelativeTime(diffSeconds: number): string {
  const abs = Math.abs(diffSeconds);
  const unit = RELATIVE_TIME_UNITS.find((u) => abs < u.limitSeconds) ?? RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];
  const value = Math.max(1, Math.round(abs / unit.divisor));
  const label = value === 1 ? unit.name : `${unit.name}s`;
  return diffSeconds >= 0 ? `in ${value} ${label}` : `${value} ${label} ago`;
}

// Explicit locale + options so server-rendered and client-hydrated output always match —
// the runtime's ambient default locale can otherwise differ between Node (SSR) and the browser.
const CLAIM_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function describeTimeClaim(key: "exp" | "iat" | "nbf", value: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diff = value - nowSeconds;
  const relative = formatRelativeTime(diff);
  const dateStr = CLAIM_DATE_FORMAT.format(new Date(value * 1000));
  const verb =
    key === "exp" ? (diff >= 0 ? "Expires" : "Expired") : key === "nbf" ? (diff >= 0 ? "Not valid until" : "Valid since") : "Issued";
  return `${verb} ${relative} (${dateStr})`;
}

function describeClaimValue(key: string, value: unknown): string {
  if ((key === "exp" || key === "iat" || key === "nbf") && typeof value === "number") {
    return describeTimeClaim(key, value);
  }
  if (Array.isArray(value)) return value.join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function claimCopyValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function buildClaimInfos(source: Record<string, unknown>): ClaimInfo[] {
  return Object.entries(source).map(([key, value]) => ({
    key,
    description: CLAIM_DESCRIPTIONS[key],
    display: describeClaimValue(key, value),
    copyValue: claimCopyValue(value),
  }));
}

export function decodeToken(token: string): DecodedJwt {
  const parts = splitJwt(token);
  const header = decodeProtectedHeader(token) as JWTHeaderParameters;
  const payload = decodeJwt(token);
  return {
    header,
    payload,
    parts,
    headerClaims: buildClaimInfos(header as Record<string, unknown>),
    payloadClaims: buildClaimInfos(payload as Record<string, unknown>),
  };
}

export type ExpiryState = "expired" | "active" | "not-yet-valid" | "none";

export interface ExpiryStatus {
  state: ExpiryState;
  label: string;
}

export function getExpiryStatus(payload: JWTPayload): ExpiryStatus {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === "number" && payload.nbf > nowSeconds) {
    return {
      state: "not-yet-valid",
      label: `Not valid for ${formatRelativeTime(payload.nbf - nowSeconds).replace(/^in /, "")}`,
    };
  }
  if (typeof payload.exp === "number") {
    const diff = payload.exp - nowSeconds;
    return {
      state: diff <= 0 ? "expired" : "active",
      label: diff <= 0 ? `Expired ${formatRelativeTime(diff)}` : `Expires ${formatRelativeTime(diff)}`,
    };
  }
  return { state: "none", label: "No expiration" };
}

export type PemKind = "public" | "private" | "unknown";

export function detectPemKind(pem: string): PemKind {
  if (/-----BEGIN (RSA )?PRIVATE KEY-----/.test(pem)) return "private";
  if (/-----BEGIN PUBLIC KEY-----/.test(pem)) return "public";
  return "unknown";
}

async function resolveKey(alg: JwtAlgorithm, keyMaterial: string, usage: "sign" | "verify") {
  if (isHmacAlgorithm(alg)) {
    if (!keyMaterial) throw new Error(`Enter a secret to ${usage === "sign" ? "sign" : "verify"} with.`);
    return new TextEncoder().encode(keyMaterial);
  }
  const kind = detectPemKind(keyMaterial);
  if (usage === "sign") {
    if (kind !== "private") {
      throw new Error(`Signing with ${alg} needs a PEM-encoded private key (PKCS#8, "-----BEGIN PRIVATE KEY-----").`);
    }
    return importPKCS8(keyMaterial, alg);
  }
  if (kind !== "public") {
    throw new Error(`Verifying with ${alg} needs a PEM-encoded public key (SPKI, "-----BEGIN PUBLIC KEY-----").`);
  }
  return importSPKI(keyMaterial, alg);
}

export interface VerifyResult {
  valid: boolean;
  expired: boolean;
  message: string;
}

export async function verifyToken(token: string, alg: JwtAlgorithm, keyMaterial: string): Promise<VerifyResult> {
  try {
    const key = await resolveKey(alg, keyMaterial, "verify");
    await jwtVerify(token, key, { algorithms: [alg] });
    return { valid: true, expired: false, message: "Signature is valid." };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return { valid: true, expired: true, message: "Signature is valid, but the token has expired." };
    }
    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      return {
        valid: true,
        expired: false,
        message: `Signature is valid, but claim "${error.claim}" failed validation (${error.reason}).`,
      };
    }
    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      return { valid: false, expired: false, message: "Signature doesn't match — wrong key, wrong algorithm, or a tampered token." };
    }
    const message = error instanceof Error ? error.message : "Couldn't verify this token.";
    return { valid: false, expired: false, message };
  }
}

export interface SignResult {
  token?: string;
  error?: string;
}

export async function signToken(headerJson: string, payloadJson: string, alg: JwtAlgorithm, keyMaterial: string): Promise<SignResult> {
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerJson);
    payload = JSON.parse(payloadJson);
  } catch {
    return { error: "Header and payload must both be valid JSON." };
  }

  try {
    const key = await resolveKey(alg, keyMaterial, "sign");
    const token = await new SignJWT(payload).setProtectedHeader({ ...header, alg }).sign(key);
    return { token };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't sign this token.";
    return { error: message };
  }
}
