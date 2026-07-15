// Centralized JWT secret loader. Fails fast when the secret is missing so the
// app never signs or verifies tokens with an insecure hardcoded fallback.
const secret = process.env.JWT_SECRET

if (!secret) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Refusing to run with an insecure fallback secret."
  )
}

export const JWT_SECRET = new TextEncoder().encode(secret)
