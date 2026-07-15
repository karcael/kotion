import { describe, it, expect } from "vitest"
import { buildSnippet } from "./search-snippet"

describe("buildSnippet", () => {
  it("returns null when query does not match", () => {
    expect(buildSnippet("hello world", "xyz")).toBeNull()
  })

  it("returns the match window with ellipses when truncated", () => {
    const text = "a".repeat(200) + " HEDEF " + "b".repeat(200)
    const snip = buildSnippet(text, "hedef", 20)!
    expect(snip.toLowerCase()).toContain("hedef")
    expect(snip.startsWith("…")).toBe(true)
    expect(snip.endsWith("…")).toBe(true)
  })

  it("does not add leading ellipsis when match is near the start", () => {
    const snip = buildSnippet("Merhaba dünya nasılsın", "merhaba", 50)!
    expect(snip.startsWith("…")).toBe(false)
    expect(snip).toContain("Merhaba")
  })

  it("is case-insensitive", () => {
    expect(buildSnippet("Büyük Harf", "büyük")).not.toBeNull()
  })
})
