import type { Extensions } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Image from "@tiptap/extension-image"
import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { common, createLowlight } from "lowlight"
import { CodeBlockComponent } from "../code-block-component"
import { Table } from "@tiptap/extension-table"
import { TableCellExtended } from "./table-cell-extended"
import { TableHeaderExtended } from "./table-header-extended"
import { TableRowExtended } from "./table-row-extended"
import { Columns, Column } from "./columns"
import { PageLink } from "./page-link"
import { SlashCommand } from "../slash-command"

const lowlight = createLowlight(common)

interface ExtensionOptions {
  onImageRequest?: (range: { from: number; to: number }) => void
  onPageLinkRequest?: (range: { from: number; to: number }) => void
}

export function getEditorExtensions(opts: ExtensionOptions = {}): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      // Link and Underline are added separately below with custom
      // configuration, so disable StarterKit's own versions (avoids the
      // duplicate-registration warning).
      link: false,
      underline: false,
      dropcursor: { color: "var(--accent-c)", width: 2 },
    }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === "heading"
          ? `Başlık ${node.attrs.level}`
          : "Yazmaya başlayın veya '/' tuşuna basın...",
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
    Highlight.configure({ multicolor: true }),
    Underline,
    Link.configure({
      // All link clicks are handled by the single click handler in editor.tsx.
      // Leaving this on would also open the page-link's <a>, causing a double
      // navigation (both new tab and same-tab route) alongside router.push.
      openOnClick: false,
      HTMLAttributes: { class: "text-accent underline cursor-pointer" },
    }),
    TextStyle,
    Color,
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent)
      },
    }).configure({ lowlight }),
    Columns,
    Column,
    Table.configure({ resizable: true, cellMinWidth: 80 }),
    TableRowExtended,
    TableCellExtended,
    TableHeaderExtended,
    PageLink,
    SlashCommand.configure({
      onImageRequest: opts.onImageRequest,
      onPageLinkRequest: opts.onPageLinkRequest,
    }),
  ]
}
