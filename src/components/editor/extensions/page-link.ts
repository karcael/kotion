import { Node, mergeAttributes } from "@tiptap/core"

export const PageLink = Node.create({
  name: "pageLink",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: "Adsız" },
      icon: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="page-link"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { pageId, title, icon } = HTMLAttributes

    // İkon: emoji veya fallback metin
    const iconContent =
      icon && !icon.startsWith("/") && !icon.startsWith("http")
        ? icon
        : "📄"

    // Görsel ikon için ayrı element
    const iconEl: any =
      icon && (icon.startsWith("/") || icon.startsWith("http"))
        ? [
            "img",
            {
              src: icon,
              alt: "",
              style:
                "width:18px;height:18px;border-radius:3px;object-fit:cover;display:block;",
            },
          ]
        : iconContent

    return [
      "div",
      mergeAttributes(
        { "data-type": "page-link", class: "page-link-block" },
        { "data-page-id": pageId }
      ),
      [
        "a",
        {
          href: `/documents/${pageId}`,
          class: "page-link-inner",
          "data-page-navigate": pageId,
        },
        ["span", { class: "page-link-icon" }, iconEl],
        ["span", { class: "page-link-title" }, title || "Adsız"],
        ["span", { class: "page-link-arrow" }, "\u2192"],
      ],
    ]
  },
})
