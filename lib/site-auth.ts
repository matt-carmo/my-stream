// Site-wide single-password gate. Edge-safe (WebCrypto only) so it can be
// used from middleware as well as route handlers. The raw password is never
// stored: only its SHA-256 hex digest lives in SITE_ACCESS_PASSWORD_HASH.

const COOKIE_NAME = "site-auth"
const te = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getCookieName() {
  return COOKIE_NAME
}

export async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", te.encode(value)))
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(data))
  return toHex(sig)
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function verifyPassword(
  password: string,
  expectedHash: string
): Promise<boolean> {
  const actual = await sha256Hex(password)
  return timingSafeEqualHex(
    actual.toLowerCase(),
    expectedHash.trim().toLowerCase()
  )
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

// Tolerates small clock differences between the servers that sign and verify
const CLOCK_SKEW_SECONDS = 60

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

/** Create a signed `v2.<random>.<issuedAt>.<sig>` cookie value. */
export async function createSessionValue(secret: string): Promise<string> {
  const rand = toHex(crypto.getRandomValues(new Uint8Array(24)).buffer as ArrayBuffer)
  const payload = `v2.${rand}.${nowSeconds()}`
  const sig = await hmacHex(secret, payload)
  return `${payload}.${sig}`
}

/**
 * Validate a `v2.<random>.<issuedAt>.<sig>` cookie value. Expiry is enforced
 * here, not just by the browser, so a copied cookie stops working after
 * SESSION_MAX_AGE_SECONDS. Legacy `v1` cookies (no issuedAt) are rejected.
 */
export async function verifySessionValue(
  secret: string,
  value: string | undefined | null
): Promise<boolean> {
  if (!value) return false
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== "v2") return false
  const [version, rand, issuedAtStr, sig] = parts
  const issuedAt = Number(issuedAtStr)
  if (!rand || !sig || !/^\d+$/.test(issuedAtStr)) return false

  const age = nowSeconds() - issuedAt
  if (age > SESSION_MAX_AGE_SECONDS || age < -CLOCK_SKEW_SECONDS) return false

  const expected = await hmacHex(secret, `${version}.${rand}.${issuedAtStr}`)
  return timingSafeEqualHex(sig.toLowerCase(), expected.toLowerCase())
}
