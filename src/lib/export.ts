import { generateHTML } from "@tiptap/core"
import { getEditorExtensions } from "@/components/editor/extensions"

export interface ExportDoc {
  title: string
  icon: string | null
  coverImage: string | null
  content: unknown
}

export function slugify(title: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  }
  const s = title
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || "kotion-sayfa"
}

// Self-contained content styles so the exported file renders like the editor.
const EXPORT_STYLES = `
  :root { color-scheme: light; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 820px;
    margin: 40px auto; padding: 0 20px; color: #1f2328; line-height: 1.6; }
  h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
  img { max-width: 100%; border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d0d7de; padding: 6px 10px; }
  pre { background: #f6f8fa; padding: 12px; border-radius: 8px; overflow-x: auto; }
  code { font-family: ui-monospace, monospace; }
  blockquote { border-left: 3px solid #d0d7de; margin: 0; padding-left: 12px; color: #57606a; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  .cover { width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
  /* Multi-column layout. Mirrors the editor: a grid whose columns are sized by
     the data-columns count, unless an inline grid-template-columns (from the
     widths attribute) overrides it. The editor's container-query width/margins
     are intentionally dropped here since the export has no sidebar. */
  .columns-layout { display: grid; gap: 1rem; margin: 1em 0; }
  .columns-layout[data-columns="2"] { grid-template-columns: 1fr 1fr; }
  .columns-layout[data-columns="3"] { grid-template-columns: 1fr 1fr 1fr; }
  .columns-layout[data-columns="4"] { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .column-block { min-width: 0; }
  /* Page-link block */
  .page-link-block { margin: 0.75em 0; }
  .page-link-inner { display: inline-flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1.125rem;
    border-radius: 12px; border: 1px solid #e8e8e3; background: #f5f5f5; text-decoration: none; color: #37352f; }
  .page-link-icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
    border-radius: 8px; background: #ffffff; border: 1px solid #e8e8e3; font-size: 16px; }
  .page-link-title { font-weight: 500; }
  .page-link-arrow { color: #91918e; }
  @media print { body { margin: 0; max-width: none; } pre, table { page-break-inside: avoid; } }
`

export function buildDocumentHTML(doc: ExportDoc, bodyHTML: string): string {
  const cover = doc.coverImage
    ? `<img class="cover" src="${escapeHtml(doc.coverImage)}" alt="" />`
    : ""
  const iconPrefix =
    doc.icon && !doc.icon.startsWith("/") && !doc.icon.startsWith("http")
      ? `${escapeHtml(doc.icon)} `
      : ""
  const safeTitle = escapeHtml(doc.title || "Adsız")
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<style>${EXPORT_STYLES}</style></head>
<body>${cover}<h1>${iconPrefix}${safeTitle}</h1>${bodyHTML}</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

// True when `src` resolves to the same origin as the running app (as opposed
// to merely starting with the same characters, which `startsWith` would
// wrongly accept for e.g. https://<origin>.evil.com/...).
function isAppInternal(src: string): boolean {
  try {
    return new URL(src, location.href).origin === location.origin
  } catch {
    return false
  }
}

// Fetches an app image and returns a data: URI; falls back to the original url.
async function toDataUri(url: string): Promise<string> {
  try {
    const res = await fetch(url, { credentials: "include" })
    if (!res.ok) return url
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(url)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

export async function documentToHTML(doc: ExportDoc): Promise<string> {
  let bodyHTML = generateHTML(
    (doc.content as Record<string, unknown>) ?? { type: "doc", content: [] },
    getEditorExtensions()
  )

  // Inline app-hosted images as data URIs so the file is self-contained.
  const container = document.createElement("div")
  container.innerHTML = bodyHTML
  const imgs = Array.from(container.querySelectorAll("img"))
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || ""
      if (isAppInternal(src)) {
        img.setAttribute("src", await toDataUri(src))
      }
    })
  )
  bodyHTML = container.innerHTML

  let coverImage = doc.coverImage
  if (coverImage && isAppInternal(coverImage)) {
    coverImage = await toDataUri(coverImage)
  }

  return buildDocumentHTML({ ...doc, coverImage }, bodyHTML)
}

export async function exportAsHTML(doc: ExportDoc): Promise<void> {
  const html = await documentToHTML(doc)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${slugify(doc.title)}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportAsPDF(doc: ExportDoc): Promise<void> {
  const html = await documentToHTML(doc)
  // Hidden same-document iframe avoids popup blockers.
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)
  const doc2 = iframe.contentWindow?.document
  if (!doc2) {
    iframe.remove()
    return
  }
  doc2.open()
  doc2.write(html)
  doc2.close()
  // Wait for images/layout before printing.
  const win = iframe.contentWindow!
  const cleanup = () => setTimeout(() => iframe.remove(), 1000)
  win.onafterprint = cleanup
  setTimeout(() => {
    win.focus()
    win.print()
    // Fallback cleanup if onafterprint never fires.
    setTimeout(cleanup, 60000)
  }, 300)
}
