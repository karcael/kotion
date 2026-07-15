// Block-level node types that should be separated by a newline in plain text.
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "taskItem",
  "blockquote",
  "codeBlock",
  "tableRow",
  "column",
])

interface TiptapNode {
  type?: string
  text?: string
  content?: TiptapNode[]
}

/**
 * Derives readable plain text from a Tiptap JSON document. Text nodes are
 * concatenated; block-level nodes are separated by newlines so words do not run
 * together and snippets read naturally. Used for content search indexing.
 */
export function extractPlainText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return ""
  const parts: string[] = []

  const walk = (node: TiptapNode) => {
    if (typeof node.text === "string") {
      parts.push(node.text)
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
    if (node.type && BLOCK_TYPES.has(node.type)) {
      parts.push("\n")
    }
  }

  walk(doc as TiptapNode)

  return parts
    .join("")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim()
}
