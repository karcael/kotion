// Centralized JWT secret loader. Fails fast when the secret is missing so the
// app never signs or verifies tokens with an insecure hardcoded fallback.
//
// The secret is resolved on first use rather than at module scope: `next build`
// evaluates route modules while collecting page data, and no runtime env vars
// are set at that point, so a module-scope check would fail the build instead
// of the request.
let cached: Uint8Array | undefined

export function getJwtSecret(): Uint8Array {
  if (cached) return cached

  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Refusing to run with an insecure fallback secret."
    )
  }

  cached = new TextEncoder().encode(secret)
  return cached
}
