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
  @media print { body { margin: 0; max-width: none; } pre, table { page-break-inside: avoid; } }
`

export function buildDocumentHTML(doc: ExportDoc, bodyHTML: string): string {
  const cover = doc.coverImage
    ? `<img class="cover" src="${doc.coverImage}" alt="" />`
    : ""
  const iconPrefix =
    doc.icon && !doc.icon.startsWith("/") && !doc.icon.startsWith("http")
      ? `${doc.icon} `
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
    .replace(/"/g, "&quot;")
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
      if (src.startsWith("/api/files/") || src.startsWith(location.origin)) {
        img.setAttribute("src", await toDataUri(src))
      }
    })
  )
  bodyHTML = container.innerHTML

  let coverImage = doc.coverImage
  if (coverImage && (coverImage.startsWith("/api/files/") || coverImage.startsWith(location.origin))) {
    coverImage = await toDataUri(coverImage)
  }

  return buildDocumentHTML({ ...doc, coverImage }, bodyHTML)
}
