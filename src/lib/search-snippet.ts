/**
 * Returns a plain-text window around the first case-insensitive occurrence of
 * `query` in `text`, trimmed to word boundaries, with ellipses when truncated.
 * Returns null when there is no match. Output is plain text (the caller applies
 * highlighting), never HTML.
 */
export function buildSnippet(
  text: string,
  query: string,
  radius = 75
): string | null {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return null

  let start = Math.max(0, idx - radius)
  let end = Math.min(text.length, idx + query.length + radius)

  // Snap to word boundaries so words are not cut mid-way.
  if (start > 0) {
    const space = text.indexOf(" ", start)
    if (space !== -1 && space < idx) start = space + 1
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end)
    if (space !== -1 && space > idx + query.length) end = space
  }

  let snippet = text.slice(start, end).trim()
  if (start > 0) snippet = "…" + snippet
  if (end < text.length) snippet = snippet + "…"
  return snippet
}
