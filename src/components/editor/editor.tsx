"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/stores/use-session"
import { useEditor, EditorContent } from "@tiptap/react"
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
import { CodeBlockComponent } from "./code-block-component"
import { Table } from "@tiptap/extension-table"
import { TableCellExtended } from "./extensions/table-cell-extended"
import { TableHeaderExtended } from "./extensions/table-header-extended"
import { TableRowExtended } from "./extensions/table-row-extended"
import { common, createLowlight } from "lowlight"
import { SlashCommand } from "./slash-command"
import { BubbleMenuBar } from "./bubble-menu-bar"
import { TableMenu } from "./table-menu"
import { ColumnsMenu } from "./columns-menu"
import { Columns, Column } from "./extensions/columns"
import { DragHandleReact } from "./drag-handle-react"
import { TableRowResize } from "./table-row-resize"
import { ColumnResize } from "./column-resize"
import { PageLink } from "./extensions/page-link"
import { ImageUploadDialog } from "@/components/image-upload-dialog"
import { PageLinkDialog } from "@/components/page-link-dialog"

const lowlight = createLowlight(common)

interface EditorProps {
  documentId?: string
  initialContent?: unknown
  onChange?: (content: unknown) => void
  editable?: boolean
}

export function Editor({
  documentId,
  initialContent,
  onChange,
  editable = true,
}: EditorProps) {
  const router = useRouter()
  const setSessionExpired = useSession((s) => s.setSessionExpired)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Polling: son yerel değişiklik zamanı (yazarken polling güncellemeyi engelle)
  const lastLocalEditRef = useRef(0)
  const lastContentHashRef = useRef("")

  const [bubbleMenuPos, setBubbleMenuPos] = useState<{
    top: number
    left: number
  } | null>(null)

  const [tableMenuPos, setTableMenuPos] = useState<{
    top: number
    left: number
  } | null>(null)

  const [isInTable, setIsInTable] = useState(false)
  const [isInColumns, setIsInColumns] = useState(false)
  const [columnsMenuPos, setColumnsMenuPos] = useState<{
    top: number
    left: number
  } | null>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showPageLinkDialog, setShowPageLinkDialog] = useState(false)
  const pendingImageRangeRef = useRef<{ from: number; to: number } | null>(
    null
  )
  const pendingPageLinkRangeRef = useRef<{ from: number; to: number } | null>(
    null
  )
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: {
          color: "var(--accent-c)",
          width: 2,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Başlık ${node.attrs.level}`
          }
          return "Yazmaya başlayın veya '/' tuşuna basın..."
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
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
        onImageRequest: (range: { from: number; to: number }) => {
          pendingImageRangeRef.current = range
          setShowImageDialog(true)
        },
        onPageLinkRequest: (range: { from: number; to: number }) => {
          pendingPageLinkRangeRef.current = range
          setShowPageLinkDialog(true)
        },
      }),
    ],
    content: initialContent as Record<string, unknown> | undefined,
    editable,
    editorProps: {
      attributes: {
        class: "focus:outline-none max-w-full",
      },
    },
    onUpdate: ({ editor }) => {
      lastLocalEditRef.current = Date.now()
      const json = editor.getJSON()
      lastContentHashRef.current = JSON.stringify(json)
      onChangeRef.current?.(json)
    },
    onSelectionUpdate: ({ editor }) => {
      try {
        const { from, to } = editor.state.selection

        const inTable = editor.isActive("table")
        setIsInTable(inTable)

        if (inTable) {
          try {
            const { view } = editor
            const domAtPos = view.domAtPos(from)
            const tableEl =
              (domAtPos.node as HTMLElement)?.closest?.("table") ||
              (domAtPos.node.parentElement as HTMLElement)?.closest?.("table")

            if (tableEl) {
              const rect = tableEl.getBoundingClientRect()
              setTableMenuPos({
                top: rect.top - 44,
                left: rect.left + rect.width / 2,
              })
            }
          } catch {
            // Position may be invalid during table resize
          }

          if (from === to) {
            setBubbleMenuPos(null)
          }
        } else {
          setTableMenuPos(null)
        }

        const { $from } = editor.state.selection
        let inColumns = false
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === "columns") {
            inColumns = true
            try {
              const { view } = editor
              const domAtPos = view.domAtPos(from)
              const columnsEl =
                (domAtPos.node as HTMLElement)?.closest?.(".columns-layout") ||
                (domAtPos.node.parentElement as HTMLElement)?.closest?.(
                  ".columns-layout"
                )

              if (columnsEl) {
                const rect = columnsEl.getBoundingClientRect()
                setColumnsMenuPos({
                  top: rect.top - 44,
                  left: rect.left + rect.width / 2,
                })
              }
            } catch {
              // Position may be invalid during resize
            }
            break
          }
        }
        setIsInColumns(inColumns)
        if (!inColumns) setColumnsMenuPos(null)

        if (from === to) {
          setBubbleMenuPos(null)
          return
        }

        const { view } = editor
        const start = view.coordsAtPos(from)
        const end = view.coordsAtPos(to)

        setBubbleMenuPos({
          top: start.top - 50,
          left: (start.left + end.left) / 2,
        })
      } catch {
        // Ignore position errors during concurrent operations
      }
    },
    onBlur: () => {
      setTimeout(() => {
        setBubbleMenuPos(null)
      }, 200)
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])


  // === Polling: karşı tarafın değişikliklerini 3 saniyede bir kontrol et ===
  useEffect(() => {
    if (!documentId || !editor) return

    const interval = setInterval(async () => {
      // Son 3 saniyede yazdıysa güncelleme yapma (çakışmayı önle)
      if (Date.now() - lastLocalEditRef.current < 3000) return

      try {
        const res = await fetch(`/api/documents/${documentId}`)
        if (res.status === 401) {
          setSessionExpired(true)
          return
        }
        if (!res.ok) return
        const data = await res.json()

        if (!data.content) return

        const remoteHash = JSON.stringify(data.content)

        // İçerik değişmediyse atla
        if (remoteHash === lastContentHashRef.current) return

        // Editör içeriğini güncelle (imleç pozisyonunu koru)
        const { from, to } = editor.state.selection
        editor.commands.setContent(data.content, { emitUpdate: false })
        lastContentHashRef.current = remoteHash

        // İmleç pozisyonunu geri yükle (güvenli sınırlarla)
        try {
          const maxPos = editor.state.doc.content.size
          const safeFrom = Math.min(from, maxPos)
          const safeTo = Math.min(to, maxPos)
          editor.commands.setTextSelection({ from: safeFrom, to: safeTo })
        } catch {
          // İmleç geri yüklenemezse sorun değil
        }
      } catch {
        // Sessiz hata
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [documentId, editor, setSessionExpired])

  const handleImageSelected = (url: string) => {
    if (!editor) return

    const range = pendingImageRangeRef.current
    if (range) {
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
      pendingImageRangeRef.current = null
    } else {
      editor.chain().focus().setImage({ src: url }).run()
    }
    setShowImageDialog(false)
  }

  const handlePageLinkSelected = (page: { id: string; title: string; icon: string | null }) => {
    if (!editor) return

    const range = pendingPageLinkRangeRef.current
    if (range) {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "pageLink",
          attrs: { pageId: page.id, title: page.title, icon: page.icon },
        })
        .run()
      pendingPageLinkRangeRef.current = null
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "pageLink",
          attrs: { pageId: page.id, title: page.title, icon: page.icon },
        })
        .run()
    }
    setShowPageLinkDialog(false)
  }

  // Sayfa bağlantısına tıklama: Next.js router (aynı sekmede SPA geçişi)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("[data-page-navigate]")
      if (link) {
        e.preventDefault()
        e.stopPropagation()
        const pageId = link.getAttribute("data-page-navigate")
        if (pageId) {
          router.push(`/documents/${pageId}`)
        }
      }
    }

    const container = editorContainerRef.current
    if (!container) return
    container.addEventListener("click", handleClick)
    return () => container.removeEventListener("click", handleClick)
  }, [router, editor]) // editor hazır olduğunda ref de dolu olur

  if (!editor) return null

  return (
    <div className="relative" ref={editorContainerRef}>
      {bubbleMenuPos && editable && (
        <div
          className="fixed z-50"
          style={{
            top: `${bubbleMenuPos.top}px`,
            left: `${bubbleMenuPos.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          <BubbleMenuBar editor={editor} />
        </div>
      )}

      {isInTable && tableMenuPos && editable && (
        <div
          className="fixed z-50"
          style={{
            top: `${tableMenuPos.top}px`,
            left: `${tableMenuPos.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          <TableMenu editor={editor} />
        </div>
      )}

      {isInColumns && columnsMenuPos && editable && !isInTable && (
        <div
          className="fixed z-50"
          style={{
            top: `${columnsMenuPos.top}px`,
            left: `${columnsMenuPos.left}px`,
            transform: "translateX(-50%)",
          }}
        >
          <ColumnsMenu editor={editor} />
        </div>
      )}

      <DragHandleReact editor={editor} containerRef={editorContainerRef} />
      <TableRowResize editor={editor} />
      <ColumnResize editor={editor} />

      <EditorContent editor={editor} />

      {showImageDialog && (
        <ImageUploadDialog
          title="Görsel Ekle"
          onSelect={handleImageSelected}
          onClose={() => {
            setShowImageDialog(false)
            pendingImageRangeRef.current = null
          }}
        />
      )}

      {showPageLinkDialog && (
        <PageLinkDialog
          onSelect={handlePageLinkSelected}
          onClose={() => {
            setShowPageLinkDialog(false)
            pendingPageLinkRangeRef.current = null
          }}
        />
      )}
    </div>
  )
}
