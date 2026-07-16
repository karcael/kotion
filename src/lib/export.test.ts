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

  it("escapes dangerous characters in title, icon, and coverImage", () => {
    const html = buildDocumentHTML(
      {
        title: "Kötü <script>",
        icon: "<img onerror=x>",
        coverImage: 'a" onerror="x',
        content: {},
      },
      "<p>gövde</p>"
    )

    // Raw, unescaped payloads must never appear verbatim.
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("onerror=x>")
    expect(html).not.toContain('src="a" onerror="x"')

    // Escaped forms must be present instead.
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img onerror=x&gt;")
    expect(html).toContain('src="a&quot; onerror=&quot;x"')
  })
})
