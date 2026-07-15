import { describe, it, expect } from "vitest"
import { slugify, buildDocumentHTML } from "./export"

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Proje Planı 2026")).toBe("proje-plani-2026")
  })
  it("falls back for empty", () => {
    expect(slugify("   ")).toBe("kotion-sayfa")
  })
})

describe("buildDocumentHTML", () => {
  it("wraps body and includes the title", () => {
    const html = buildDocumentHTML(
      { title: "Notum", icon: null, coverImage: null, content: {} },
      "<p>gövde</p>"
    )
    expect(html).toContain("<title>Notum</title>")
    expect(html).toContain("<p>gövde</p>")
    expect(html).toContain("<!doctype html>")
  })
})
