"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"
import { useEditorState } from "@tiptap/react"
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  Rows3,
  Columns3,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  TableProperties,
} from "lucide-react"

interface TableMenuProps {
  editor: Editor
}

type TextAlign = "left" | "center" | "right"
type VerticalAlign = "top" | "middle" | "bottom"

export function TableMenu({ editor }: TableMenuProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const setCellAttr = (attr: string, value: string) => {
    editor.chain().focus().setCellAttribute(attr, value).run()
  }

  // Subscribe to editor state so the active-state highlights update immediately
  // when a cell attribute changes (a cell-attribute change does not move the
  // selection, so onSelectionUpdate alone would not re-render this menu).
  const { currentTextAlign, currentVerticalAlign, isHeaderActive } =
    useEditorState({
      editor,
      selector: ({ editor }) => {
        const cellAttrs = editor.getAttributes("tableCell")
        const headerAttrs = editor.getAttributes("tableHeader")
        return {
          currentTextAlign: (cellAttrs.textAlign ||
            headerAttrs.textAlign ||
            "left") as TextAlign,
          currentVerticalAlign: (cellAttrs.verticalAlign ||
            headerAttrs.verticalAlign ||
            "top") as VerticalAlign,
          isHeaderActive: editor.isActive("tableHeader"),
        }
      },
    })

  const rowColItems = [
    {
      section: "row",
      actions: [
        {
          icon: ArrowUpToLine,
          label: "Üste satır ekle",
          action: () => editor.chain().focus().addRowBefore().run(),
        },
        {
          icon: ArrowDownToLine,
          label: "Alta satır ekle",
          action: () => editor.chain().focus().addRowAfter().run(),
        },
        {
          icon: Rows3,
          label: "Satırı sil",
          action: () => editor.chain().focus().deleteRow().run(),
          destructive: true,
        },
      ],
    },
    {
      section: "col",
      actions: [
        {
          icon: ArrowLeftToLine,
          label: "Sola sütun ekle",
          action: () => editor.chain().focus().addColumnBefore().run(),
        },
        {
          icon: ArrowRightToLine,
          label: "Sağa sütun ekle",
          action: () => editor.chain().focus().addColumnAfter().run(),
        },
        {
          icon: Columns3,
          label: "Sütunu sil",
          action: () => editor.chain().focus().deleteColumn().run(),
          destructive: true,
        },
      ],
    },
  ]

  const hAlignItems: { icon: typeof AlignLeft; value: TextAlign; label: string }[] = [
    { icon: AlignLeft, value: "left", label: "Sola yasla" },
    { icon: AlignCenter, value: "center", label: "Ortala" },
    { icon: AlignRight, value: "right", label: "Sağa yasla" },
  ]

  const vAlignItems: { icon: typeof AlignVerticalJustifyStart; value: VerticalAlign; label: string }[] = [
    { icon: AlignVerticalJustifyStart, value: "top", label: "Yukarı yasla" },
    { icon: AlignVerticalJustifyCenter, value: "middle", label: "Ortala (dikey)" },
    { icon: AlignVerticalJustifyEnd, value: "bottom", label: "Aşağı yasla" },
  ]

  return (
    <div className="animate-scale-in flex items-center gap-0.5 rounded-xl border border-border/50 bg-popover p-1 shadow-xl">
      {/* Row & Column actions */}
      {rowColItems.map((group, gi) => (
        <div key={group.section} className="flex items-center gap-0.5">
          {gi > 0 && <div className="mx-0.5 h-5 w-px bg-border/60" />}
          {group.actions.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.preventDefault()
                  item.action()
                }}
                onMouseDown={(e) => e.preventDefault()}
                title={item.label}
                className={`rounded-lg p-1.5 transition-all duration-150 ${
                  item.destructive
                    ? "text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      ))}

      {/* Toggle header row */}
      <div className="mx-0.5 h-5 w-px bg-border/60" />
      <button
        onClick={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleHeaderRow().run()
        }}
        onMouseDown={(e) => e.preventDefault()}
        title="Başlık satırı ekle/kaldır"
        className={`rounded-lg p-1.5 transition-all duration-150 ${
          isHeaderActive
            ? "bg-accent/15 text-accent"
            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        <TableProperties className="h-4 w-4" />
      </button>

      {/* Horizontal alignment */}
      <div className="mx-0.5 h-5 w-px bg-border/60" />
      <div className="flex items-center gap-0.5">
        {hAlignItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTextAlign === item.value
          return (
            <button
              key={item.value}
              onClick={(e) => {
                e.preventDefault()
                setCellAttr("textAlign", item.value)
              }}
              onMouseDown={(e) => e.preventDefault()}
              title={item.label}
              className={`rounded-lg p-1.5 transition-all duration-150 ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>

      {/* Vertical alignment */}
      <div className="mx-0.5 h-5 w-px bg-border/60" />
      <div className="flex items-center gap-0.5">
        {vAlignItems.map((item) => {
          const Icon = item.icon
          const isActive = currentVerticalAlign === item.value
          return (
            <button
              key={item.value}
              onClick={(e) => {
                e.preventDefault()
                setCellAttr("verticalAlign", item.value)
              }}
              onMouseDown={(e) => e.preventDefault()}
              title={item.label}
              className={`rounded-lg p-1.5 transition-all duration-150 ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>

      {/* Delete table */}
      <div className="mx-0.5 h-5 w-px bg-border/60" />
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowConfirm(true)
          }}
          onMouseDown={(e) => e.preventDefault()}
          title="Tabloyu sil"
          className="rounded-lg p-1.5 text-destructive/70 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {showConfirm && (
          <>
            <div
              className="fixed inset-0 z-[99]"
              onClick={() => setShowConfirm(false)}
            />
            <div className="absolute right-0 top-full z-[100] mt-2 w-56 animate-scale-in rounded-xl border border-border/60 bg-popover p-3 shadow-xl">
              <p className="text-sm font-medium">Tabloyu silmek istediğinize emin misiniz?</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/80"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().deleteTable().run()
                    setShowConfirm(false)
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  Sil
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
