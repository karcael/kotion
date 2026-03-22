"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  GripVertical,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
} from "lucide-react"
import type { Editor } from "@tiptap/react"

interface DragHandleProps {
  editor: Editor
  containerRef: React.RefObject<HTMLDivElement | null>
}

function getBlockElements(editor: Editor): HTMLElement[] {
  const editorDom = editor.view.dom
  return Array.from(editorDom.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  )
}

function getDropIndex(blocks: HTMLElement[], clientY: number): number {
  for (let i = 0; i < blocks.length; i++) {
    const rect = blocks[i].getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    if (clientY < mid) return i
  }
  return blocks.length
}

// Blok tipini Türkçe label olarak döndür
function getBlockLabel(blockJson: any): string {
  if (!blockJson) return "Blok"
  switch (blockJson.type) {
    case "heading":
      return `Başlık ${blockJson.attrs?.level || 1}`
    case "paragraph":
      return "Metin"
    case "bulletList":
      return "Madde Listesi"
    case "orderedList":
      return "Sıralı Liste"
    case "taskList":
      return "Yapılacaklar"
    case "codeBlock":
      return "Kod Bloğu"
    case "blockquote":
      return "Alıntı"
    case "table":
      return "Tablo"
    case "columns":
      return "Sütunlar"
    case "horizontalRule":
      return "Ayırıcı"
    case "image":
      return "Görsel"
    case "pageLink":
      return "Sayfa Bağlantısı"
    default:
      return "Blok"
  }
}

// Bloğun dönüştürülebileceği tipler
function getConvertOptions(blockType: string, level?: number) {
  const options = [
    { type: "paragraph", label: "Metin", icon: AlignLeft },
    { type: "heading1", label: "Başlık 1", icon: Heading1 },
    { type: "heading2", label: "Başlık 2", icon: Heading2 },
    { type: "heading3", label: "Başlık 3", icon: Heading3 },
    { type: "bulletList", label: "Madde Listesi", icon: List },
    { type: "orderedList", label: "Sıralı Liste", icon: ListOrdered },
    { type: "taskList", label: "Yapılacaklar", icon: CheckSquare },
    { type: "codeBlock", label: "Kod Bloğu", icon: Code },
    { type: "blockquote", label: "Alıntı", icon: Quote },
  ]

  // Mevcut tipi filtrele
  const currentKey =
    blockType === "heading" ? `heading${level}` : blockType
  return options.filter((o) => o.type !== currentKey)
}

export function DragHandleReact({ editor, containerRef }: DragHandleProps) {
  const [visible, setVisible] = useState(false)
  const [handlePos, setHandlePos] = useState({ top: 0, left: 0 })
  const [indicatorPos, setIndicatorPos] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [currentBlockJson, setCurrentBlockJson] = useState<any>(null)
  const sourceIndexRef = useRef<number | null>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updateHandleForBlock = useCallback(
    (blockEl: HTMLElement, index: number) => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const blockRect = blockEl.getBoundingClientRect()

      setHandlePos({
        top: blockRect.top - containerRect.top + 2,
        left: blockRect.left - containerRect.left - 30,
      })
      setVisible(true)
      sourceIndexRef.current = index

      // Blok JSON bilgisini güncelle
      const json = editor.getJSON()
      if (json.content && json.content[index]) {
        setCurrentBlockJson(json.content[index])
      }
    },
    [containerRef, editor]
  )

  // Mouse move
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging || showMenu) return
      if (handleRef.current?.contains(e.target as Node)) return
      if (menuRef.current?.contains(e.target as Node)) return

      const blocks = getBlockElements(editor)
      let found = -1

      for (let i = 0; i < blocks.length; i++) {
        const rect = blocks[i].getBoundingClientRect()
        if (e.clientY >= rect.top - 2 && e.clientY <= rect.bottom + 2) {
          found = i
          break
        }
      }

      if (found >= 0) {
        updateHandleForBlock(blocks[found], found)
      } else {
        setVisible(false)
        sourceIndexRef.current = null
      }
    }

    const onMouseLeave = (e: MouseEvent) => {
      if (isDragging || showMenu) return
      const related = e.relatedTarget as HTMLElement | null
      if (handleRef.current?.contains(related)) return
      if (menuRef.current?.contains(related)) return
      setVisible(false)
    }

    container.addEventListener("mousemove", onMouseMove)
    container.addEventListener("mouseleave", onMouseLeave)

    return () => {
      container.removeEventListener("mousemove", onMouseMove)
      container.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [editor, containerRef, isDragging, showMenu, updateHandleForBlock])

  // Menü dışına tıklama
  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        handleRef.current &&
        !handleRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMenu])

  // Tıklama: menü aç
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (sourceIndexRef.current === null) return

      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()

      // Menü konumunu viewport sınırlarına göre ayarla
      let menuTop = handlePos.top + 28
      let menuLeft = handlePos.left
      const menuHeight = 350
      const menuWidth = 210

      // Alt taşma: menüyü yukarı aç
      if (containerRect.top + menuTop + menuHeight > window.innerHeight) {
        menuTop = handlePos.top - menuHeight
        if (containerRect.top + menuTop < 0) menuTop = 8
      }

      // Sol taşma
      if (containerRect.left + menuLeft < 0) menuLeft = 8

      setMenuPos({
        top: menuTop,
        left: menuLeft,
      })
      setShowMenu((prev) => !prev)
    },
    [handlePos, containerRef]
  )

  // Sürükleme başlat
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (showMenu) return
      e.preventDefault()
      if (sourceIndexRef.current === null) return

      const startX = e.clientX
      const startY = e.clientY
      let hasMoved = false

      const srcIdx = sourceIndexRef.current

      const onMove = (me: MouseEvent) => {
        const dx = Math.abs(me.clientX - startX)
        const dy = Math.abs(me.clientY - startY)

        if (!hasMoved && dx + dy < 5) return
        hasMoved = true

        if (!isDragging) {
          setIsDragging(true)
          const blocks = getBlockElements(editor)
          blocks[srcIdx]?.classList.add("dragging-block")
          document.body.style.cursor = "grabbing"
        }

        const container = containerRef.current
        if (!container) return

        const blocks = getBlockElements(editor)
        const dropIdx = getDropIndex(blocks, me.clientY)
        const containerRect = container.getBoundingClientRect()

        let y: number
        if (dropIdx < blocks.length) {
          y = blocks[dropIdx].getBoundingClientRect().top - containerRect.top
        } else if (blocks.length > 0) {
          const last = blocks[blocks.length - 1]
          y = last.getBoundingClientRect().bottom - containerRect.top
        } else {
          return
        }

        setIndicatorPos(y)
      }

      const onUp = (me: MouseEvent) => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        document.body.style.cursor = ""

        const blocks = getBlockElements(editor)
        blocks[srcIdx]?.classList.remove("dragging-block")
        setIsDragging(false)
        setIndicatorPos(null)

        if (!hasMoved) return // Tıklama — menü handleClick'te açılacak

        setVisible(false)

        const dropIdx = getDropIndex(blocks, me.clientY)
        if (dropIdx === srcIdx || dropIdx === srcIdx + 1) return

        const json = editor.getJSON()
        if (!json.content) return

        const content = [...json.content]
        const [moved] = content.splice(srcIdx, 1)
        const insertIdx = dropIdx > srcIdx ? dropIdx - 1 : dropIdx
        content.splice(insertIdx, 0, moved)

        editor.commands.setContent({ type: "doc", content })
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [editor, containerRef, isDragging, showMenu]
  )

  // Blok sil
  const handleDelete = () => {
    if (sourceIndexRef.current === null) return
    const json = editor.getJSON()
    if (!json.content) return

    const content = [...json.content]
    content.splice(sourceIndexRef.current, 1)
    if (content.length === 0) {
      content.push({ type: "paragraph" } as any)
    }
    editor.commands.setContent({ type: "doc", content })
    setShowMenu(false)
    setVisible(false)
  }

  // Blok kopyala (duplicate)
  const handleDuplicate = () => {
    if (sourceIndexRef.current === null) return
    const json = editor.getJSON()
    if (!json.content) return

    const content = [...json.content]
    const cloned = JSON.parse(JSON.stringify(content[sourceIndexRef.current]))
    content.splice(sourceIndexRef.current + 1, 0, cloned)
    editor.commands.setContent({ type: "doc", content })
    setShowMenu(false)
  }

  // Yukarı taşı
  const handleMoveUp = () => {
    if (sourceIndexRef.current === null || sourceIndexRef.current === 0) return
    const json = editor.getJSON()
    if (!json.content) return

    const content = [...json.content]
    const idx = sourceIndexRef.current
    ;[content[idx - 1], content[idx]] = [content[idx], content[idx - 1]]
    editor.commands.setContent({ type: "doc", content })
    sourceIndexRef.current = idx - 1
    setShowMenu(false)
  }

  // Aşağı taşı
  const handleMoveDown = () => {
    if (sourceIndexRef.current === null) return
    const json = editor.getJSON()
    if (!json.content) return
    if (sourceIndexRef.current >= json.content.length - 1) return

    const content = [...json.content]
    const idx = sourceIndexRef.current
    ;[content[idx], content[idx + 1]] = [content[idx + 1], content[idx]]
    editor.commands.setContent({ type: "doc", content })
    sourceIndexRef.current = idx + 1
    setShowMenu(false)
  }

  // Blok tipini dönüştür
  const handleConvert = (targetType: string) => {
    if (sourceIndexRef.current === null) return
    const json = editor.getJSON()
    if (!json.content) return

    const content = [...json.content]
    const block = content[sourceIndexRef.current]

    // Mevcut blokun metin içeriğini al
    const extractText = (node: any): any[] => {
      if (node.type === "text") return [node]
      if (node.content) return node.content.flatMap(extractText)
      return []
    }

    const textContent = extractText(block)

    let newBlock: any

    if (targetType.startsWith("heading")) {
      const level = parseInt(targetType.replace("heading", ""))
      newBlock = {
        type: "heading",
        attrs: { level },
        content: textContent.length > 0 ? textContent : undefined,
      }
    } else if (targetType === "paragraph") {
      newBlock = {
        type: "paragraph",
        content: textContent.length > 0 ? textContent : undefined,
      }
    } else if (targetType === "bulletList") {
      newBlock = {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: textContent.length > 0 ? textContent : undefined,
              },
            ],
          },
        ],
      }
    } else if (targetType === "orderedList") {
      newBlock = {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: textContent.length > 0 ? textContent : undefined,
              },
            ],
          },
        ],
      }
    } else if (targetType === "taskList") {
      newBlock = {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [
              {
                type: "paragraph",
                content: textContent.length > 0 ? textContent : undefined,
              },
            ],
          },
        ],
      }
    } else if (targetType === "codeBlock") {
      const plainText = textContent.map((t: any) => t.text || "").join("")
      newBlock = {
        type: "codeBlock",
        content: plainText
          ? [{ type: "text", text: plainText }]
          : undefined,
      }
    } else if (targetType === "blockquote") {
      newBlock = {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: textContent.length > 0 ? textContent : undefined,
          },
        ],
      }
    } else {
      return
    }

    content[sourceIndexRef.current] = newBlock
    editor.commands.setContent({ type: "doc", content })
    setShowMenu(false)
  }

  if (!editor.isEditable) return null

  const blockLabel = getBlockLabel(currentBlockJson)
  const convertOptions = currentBlockJson
    ? getConvertOptions(
        currentBlockJson.type,
        currentBlockJson.attrs?.level
      )
    : []

  return (
    <>
      {/* Tutamaç */}
      <div
        ref={handleRef}
        onMouseDown={onMouseDown}
        onClick={handleClick}
        className="drag-handle"
        style={{
          position: "absolute",
          top: handlePos.top,
          left: handlePos.left,
          zIndex: 10,
          opacity: visible || isDragging || showMenu ? 1 : 0,
          pointerEvents: visible || isDragging || showMenu ? "auto" : "none",
        }}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Bırakma göstergesi */}
      {indicatorPos !== null && (
        <div
          className="drop-indicator"
          style={{
            position: "absolute",
            top: indicatorPos,
            left: 54,
            right: 0,
            zIndex: 10,
          }}
        />
      )}

      {/* Blok menüsü */}
      {showMenu && (
        <div
          ref={menuRef}
          className="animate-scale-in absolute z-50 w-52 overflow-hidden rounded-xl border border-border/50 bg-popover shadow-2xl"
          style={{
            top: menuPos.top,
            left: menuPos.left,
          }}
        >
          {/* Blok tipi etiketi */}
          <div className="border-b border-border/60 px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              {blockLabel}
            </span>
          </div>

          {/* Aksiyonlar */}
          <div className="p-1">
            <button
              onClick={handleDelete}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </button>
            <button
              onClick={handleDuplicate}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5"
            >
              <Copy className="h-4 w-4" />
              Kopyala
            </button>
            <button
              onClick={handleMoveUp}
              disabled={sourceIndexRef.current === 0}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
              Yukarı Taşı
            </button>
            <button
              onClick={handleMoveDown}
              disabled={sourceIndexRef.current === null || sourceIndexRef.current >= (editor.getJSON().content?.length ?? 1) - 1}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
              Aşağı Taşı
            </button>
          </div>

          {/* Dönüştür */}
          {convertOptions.length > 0 && (
            <>
              <div className="border-t border-border/60 px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                  Dönüştür
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto p-1">
                {convertOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleConvert(opt.type)}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-foreground/80 transition-colors hover:bg-foreground/5"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
