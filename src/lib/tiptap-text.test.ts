import { describe, it, expect } from "vitest"
import { extractPlainText } from "./tiptap-text"

describe("extractPlainText", () => {
  it("returns empty string for null/empty", () => {
    expect(extractPlainText(null)).toBe("")
    expect(extractPlainText({ type: "doc", content: [] })).toBe("")
  })

  it("extracts text from a paragraph", () => {
    const doc = { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "Merhaba dünya" }] },
    ]}
    expect(extractPlainText(doc)).toBe("Merhaba dünya")
  })

  it("separates block nodes with newlines", () => {
    const doc = { type: "doc", content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Başlık" }] },
      { type: "paragraph", content: [{ type: "text", text: "Gövde" }] },
    ]}
    expect(extractPlainText(doc)).toBe("Başlık\nGövde")
  })

  it("extracts text from nested tables and lists", () => {
    const doc = { type: "doc", content: [
      { type: "bulletList", content: [
        { type: "listItem", content: [
          { type: "paragraph", content: [{ type: "text", text: "Madde" }] },
        ]},
      ]},
    ]}
    expect(extractPlainText(doc)).toContain("Madde")
  })

  it("collapses excessive blank lines", () => {
    const doc = { type: "doc", content: [
      { type: "paragraph" },
      { type: "paragraph" },
      { type: "paragraph", content: [{ type: "text", text: "x" }] },
    ]}
    expect(extractPlainText(doc)).toBe("x")
  })
})
