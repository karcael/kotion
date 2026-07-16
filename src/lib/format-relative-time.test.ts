import { describe, it, expect } from "vitest"
import { formatRelativeTime } from "./format-relative-time"

const now = new Date("2026-07-16T12:00:00Z")

describe("formatRelativeTime", () => {
  it("just now", () => {
    expect(formatRelativeTime(new Date("2026-07-16T11:59:40Z"), now)).toBe("az önce")
  })
  it("minutes", () => {
    expect(formatRelativeTime(new Date("2026-07-16T11:45:00Z"), now)).toBe("15 dakika önce")
  })
  it("hours", () => {
    expect(formatRelativeTime(new Date("2026-07-16T09:00:00Z"), now)).toBe("3 saat önce")
  })
  it("yesterday", () => {
    expect(formatRelativeTime(new Date("2026-07-15T10:00:00Z"), now)).toBe("dün")
  })
  it("days", () => {
    expect(formatRelativeTime(new Date("2026-07-13T12:00:00Z"), now)).toBe("3 gün önce")
  })
})
