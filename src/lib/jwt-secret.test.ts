import { describe, it, expect, vi, afterEach } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("getJwtSecret", () => {
  it("does not throw while the module is imported without JWT_SECRET", async () => {
    // `next build` evaluates route modules without runtime env vars, so a
    // module-scope throw would fail the build rather than the request.
    vi.stubEnv("JWT_SECRET", undefined)
    await expect(import("./jwt-secret")).resolves.toBeDefined()
  })

  it("throws when the secret is used without JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", undefined)
    const { getJwtSecret } = await import("./jwt-secret")
    expect(() => getJwtSecret()).toThrowError(/JWT_SECRET/)
  })

  it("encodes the configured secret", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret")
    const { getJwtSecret } = await import("./jwt-secret")
    expect(getJwtSecret()).toEqual(new TextEncoder().encode("test-secret"))
  })

  it("returns the same instance on repeated calls", async () => {
    vi.stubEnv("JWT_SECRET", "test-secret")
    const { getJwtSecret } = await import("./jwt-secret")
    expect(getJwtSecret()).toBe(getJwtSecret())
  })
})
