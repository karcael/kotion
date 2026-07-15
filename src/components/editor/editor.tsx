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
import { TextSelection } from "@tiptap/pm/state"
import { stableStringify } from "@/lib/utils"

const lowlight = createLowlight(common)

interface EditorProps {
  documentId?: string
  initialContent?: unknown
  onChange?: (content: unknown) => void
  // Uzak (polling) bir güncelleme uygulandığında çağrılır. Yerel değişiklik
  // değildir, bu yüzden kaydetmeyi tetiklemez; yalnızca üst bileşenin en güncel
  // içeriği (Ctrl+S ve kurtarma için) bilmesini sağlar.
  onRemoteUpdate?: (content: unknown) => void
  editable?: boolean
}

export function Editor({
  documentId,
  initialContent,
  onChange,
  onRemoteUpdate,
  editable = true,
}: EditorProps) {
  const router = useRouter()
  const setSessionExpired = useSession((s) => s.setSessionExpired)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onRemoteUpdateRef = useRef(onRemoteUpdate)
  onRemoteUpdateRef.current = onRemoteUpdate

  // Polling durumu:
  // - lastLocalEditRef: son yerel düzenleme zamanı (yazarken poll'u engeller).
  // - lastLocalHashRef: editörün o an gösterdiği içeriğin kanonik hash'i.
  // - lastRemoteHashRef: sunucuyla son mutabık kalınan içeriğin kanonik hash'i.
  // İki ayrı hash, başarısız/uçuştaki bir kaydın ardından poll'un yerel
  // değişiklikleri eski sunucu içeriğiyle ezmesini önler.
  const lastLocalEditRef = useRef(0)
  const lastLocalHashRef = useRef("")
  const lastRemoteHashRef = useRef("")
  const dialogOpenRef = useRef(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        // Link ve Underline aşağıda özel yapılandırmayla ayrıca eklendiği için
        // StarterKit'in kendi sürümlerini kapat (çift kayıt uyarısını önler).
        link: false,
        underline: false,
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
        // Tüm bağlantı tıklamaları aşağıdaki tek handler'da yönetilir. Açık
        // bırakılırsa sayfa bağlantısının <a>'sını da açar ve router.push ile
        // birlikte çift açılmaya (hem yeni sekme hem aynı sekme) yol açar.
        openOnClick: false,
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
      lastLocalHashRef.current = stableStringify(json)
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
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = setTimeout(() => {
        setBubbleMenuPos(null)
      }, 200)
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Editör hazır olduğunda hash'leri başlangıç içeriğiyle başlat; böylece açılıştan
  // sonraki ilk poll, içerik aynıyken gereksiz bir setContent tetiklemez.
  useEffect(() => {
    if (!editor) return
    const hash = stableStringify(editor.getJSON())
    lastLocalHashRef.current = hash
    lastRemoteHashRef.current = hash
    // Yalnızca editör örneği oluşunca bir kez çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Açılışta bekleyen blur zamanlayıcısını temizle.
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  // Görsel/sayfa bağlantısı dialog'u açıkken polling uzak içeriği uygulamamalı;
  // aksi halde kaydedilmiş ekleme aralığı (range) kayar.
  useEffect(() => {
    dialogOpenRef.current = showImageDialog || showPageLinkDialog
  }, [showImageDialog, showPageLinkDialog])


  // === Polling: karşı tarafın değişikliklerini 3 saniyede bir kontrol et ===
  useEffect(() => {
    if (!documentId || !editor) return

    // Poll'un uzak içeriği güvenle uygulayıp uygulayamayacağını belirler.
    const canApplyRemote = () =>
      Date.now() - lastLocalEditRef.current >= 3000 &&
      !editor.view.composing && // IME kompozisyonunu bozma
      !dialogOpenRef.current // açık dialog'un bekleyen aralığını kaydırma

    const interval = setInterval(async () => {
      if (!canApplyRemote()) return

      try {
        const res = await fetch(`/api/documents/${documentId}`)
        if (res.status === 401) {
          setSessionExpired(true)
          return
        }
        if (!res.ok) return
        const data = await res.json()

        if (!data.content) return

        const remoteHash = stableStringify(data.content)

        // Sunucu içeriği son mutabık kalınandan değişmediyse atla.
        if (remoteHash === lastRemoteHashRef.current) return

        // Sunucu, editörün mevcut içeriğiyle aynı hale geldiyse (kendi kaydımız
        // işlendi) yalnızca işareti güncelle; yerel durumu ezme.
        if (remoteHash === lastLocalHashRef.current) {
          lastRemoteHashRef.current = remoteHash
          return
        }

        // Fetch süresince kullanıcı yazmış/dialog açmış olabilir; tekrar kontrol et.
        if (!canApplyRemote()) return

        // Karşı taraf farklı bir içerik yazmış: editörü güncelle. Bu değişikliği
        // geri alma geçmişine ekleme ve yerel kaydetmeyi tetikleme.
        const applied = applyRemoteContent(data.content)
        // Bu uzak içeriği gördük; uygulanamasa bile hash'i güncelle ki her
        // turda aynı (muhtemelen bozuk) içeriği yeniden denemeyelim.
        lastRemoteHashRef.current = remoteHash
        if (applied) {
          lastLocalHashRef.current = remoteHash
          onRemoteUpdateRef.current?.(data.content)
        }
      } catch {
        // Ağ hatası: sessizce geç, bir sonraki turda tekrar denenir.
      }
    }, 3000)

    return () => clearInterval(interval)
    // applyRemoteContent editör kapanışında stabildir; bağımlılığa gerek yok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, editor, setSessionExpired])

  // Uzak içeriği editöre uygular: geçmişe eklemez, onUpdate tetiklemez ve
  // imleç pozisyonunu güvenli sınırlar içinde korur. Başarılıysa true döner;
  // geçersiz içerik/pozisyon hatasında editöre dokunmadan false döner.
  const applyRemoteContent = useCallback(
    (content: unknown): boolean => {
      if (!editor) return false
      const { state, view } = editor
      try {
        const node = state.schema.nodeFromJSON(
          content as Record<string, unknown>
        )
        const { from, to } = state.selection
        const tr = state.tr.replaceWith(0, state.doc.content.size, node.content)
        tr.setMeta("addToHistory", false)
        tr.setMeta("preventUpdate", true)

        const newSize = tr.doc.content.size
        const safeFrom = Math.min(from, newSize)
        const safeTo = Math.min(to, newSize)
        try {
          tr.setSelection(TextSelection.create(tr.doc, safeFrom, safeTo))
        } catch {
          // İmleç geri yüklenemezse sorun değil.
        }

        view.dispatch(tr)
        return true
      } catch {
        // Geçersiz içerik veya pozisyon: editöre dokunma.
        return false
      }
    },
    [editor]
  )

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

  // Bağlantı tıklamalarını yönet. Sayfa bağlantısında normal sol tık aynı
  // sekmede SPA geçişi yapar; orta tık (tekerlek) ve Ctrl/Cmd/Shift+tık ise
  // tarayıcının varsayılan "yeni sekme" davranışına bırakılır. Harici bağlantılar
  // yeni sekmede açılır.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      const pageLink = target.closest("[data-page-navigate]")
      if (pageLink) {
        const pageId = pageLink.getAttribute("data-page-navigate")
        if (!pageId) return
        // Modifier'lı tık: tarayıcının yeni-sekme davranışını koru.
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        e.preventDefault()
        e.stopPropagation()
        router.push(`/documents/${pageId}`)
        return
      }

      // Harici bağlantı (link mark): yeni sekmede aç.
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null
      if (anchor) {
        const href = anchor.getAttribute("href") || ""
        if (/^https?:\/\//i.test(href)) {
          e.preventDefault()
          window.open(href, "_blank", "noopener,noreferrer")
        }
      }
    }

    // Orta tık (tekerlek) "click" tetiklemez; sayfa bağlantısının <a href>'i
    // sayesinde tarayıcı onu doğrudan yeni sekmede açar.
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
