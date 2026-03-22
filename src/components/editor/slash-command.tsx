"use client"

import { Extension } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import Suggestion from "@tiptap/suggestion"
import type { SuggestionOptions } from "@tiptap/suggestion"
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
} from "react"
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  ImageIcon,
  Table,
  AlignLeft,
  Columns3,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { createColumnsContent } from "./extensions/columns"

interface CommandItem {
  title: string
  description: string
  icon: LucideIcon
  command: (props: {
    editor: any
    range: any
    onImageRequest?: (range: { from: number; to: number }) => void
    onPageLinkRequest?: (range: { from: number; to: number }) => void
  }) => void
  submenu?: boolean
}

const commands: CommandItem[] = [
  {
    title: "Metin",
    description: "Normal metin paragrafı",
    icon: AlignLeft,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("paragraph").run()
    },
  },
  {
    title: "Başlık 1",
    description: "Büyük başlık",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
    },
  },
  {
    title: "Başlık 2",
    description: "Orta başlık",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
    },
  },
  {
    title: "Başlık 3",
    description: "Küçük başlık",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
    },
  },
  {
    title: "Madde Listesi",
    description: "Sırasız madde listesi",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Sıralı Liste",
    description: "Numaralı liste",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Yapılacaklar",
    description: "Onay kutusu listesi",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "Kod Bloğu",
    description: "Söz dizimi vurgulu kod",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: "Alıntı",
    description: "Alıntı bloğu",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: "Ayırıcı",
    description: "Yatay ayırıcı çizgi",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: "Görsel",
    description: "Dosya yükle veya URL ile ekle",
    icon: ImageIcon,
    command: ({ editor, range, onImageRequest }) => {
      if (onImageRequest) {
        onImageRequest(range)
      } else {
        const url = window.prompt("Görsel URL'si:")
        if (url) {
          editor.chain().focus().deleteRange(range).setImage({ src: url }).run()
        }
      }
    },
  },
  {
    title: "Sayfa Bağlantısı",
    description: "Başka bir sayfaya bağlantı ekle",
    icon: FileText,
    command: ({ range, onPageLinkRequest }) => {
      if (onPageLinkRequest) {
        onPageLinkRequest(range)
      }
    },
  },
  {
    title: "Tablo",
    description: "3x3 tablo ekle",
    icon: Table,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: "Sütunlar",
    description: "İçeriği sütunlara böl",
    icon: Columns3,
    // hasSubmenu işareti — CommandList'te alt menü gösterecek
    command: () => {},
    submenu: true,
  },
]

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const COLUMN_OPTIONS = [
  { count: 2, label: "2 Sütun" },
  { count: 3, label: "3 Sütun" },
  { count: 4, label: "4 Sütun" },
]

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [showColumnPicker, setShowColumnPicker] = useState(false)
    const [columnEditorRange, setColumnEditorRange] = useState<any>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
      setShowColumnPicker(false)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (showColumnPicker) {
          if (event.key === "Escape") {
            setShowColumnPicker(false)
            return true
          }
          return false
        }
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          const item = items[selectedIndex]
          if (item?.submenu) {
            setShowColumnPicker(true)
            return true
          }
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    useEffect(() => {
      const el = scrollRef.current?.children[selectedIndex] as HTMLElement | undefined
      el?.scrollIntoView({ block: "nearest" })
    }, [selectedIndex])

    if (items.length === 0) {
      return (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-popover p-3 shadow-2xl">
          <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
        </div>
      )
    }

    return (
      <div
        className="z-50 max-h-80 w-72 overflow-y-auto rounded-2xl border border-border/50 bg-popover p-1.5 shadow-2xl"
        ref={scrollRef}
      >
        {items.map((item, index) => {
          const Icon = item.icon
          const isSelected = index === selectedIndex

          return (
            <div key={item.title}>
              <button
                onClick={() => {
                  if (item.submenu) {
                    setShowColumnPicker(!showColumnPicker)
                    setSelectedIndex(index)
                  } else {
                    command(item)
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-accent/10 text-foreground"
                    : "text-foreground/80 hover:bg-foreground/[0.04]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    isSelected
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                {item.submenu && (
                  <span className={`text-[11px] text-muted-foreground transition-transform ${showColumnPicker && isSelected ? "rotate-90" : ""}`}>▸</span>
                )}
              </button>

              {/* Sütun sayısı seçici — inline olarak altında açılır */}
              {item.submenu && showColumnPicker && isSelected && (
                <div className="animate-slide-down mx-2 mb-1 mt-0.5 flex gap-1.5 rounded-xl bg-muted/50 p-2">
                  {COLUMN_OPTIONS.map((opt) => (
                    <button
                      key={opt.count}
                      onClick={(e) => {
                        e.stopPropagation()
                        command({
                          ...item,
                          submenu: false,
                          command: ({ editor, range }) => {
                            editor
                              .chain()
                              .focus()
                              .deleteRange(range)
                              .insertContent(createColumnsContent(opt.count))
                              .run()
                          },
                        })
                      }}
                      className="flex flex-1 flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-background"
                    >
                      <div className="flex gap-[3px]">
                        {Array.from({ length: opt.count }).map((_, i) => (
                          <div
                            key={i}
                            className="h-6 w-3 rounded-sm bg-accent/50"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{opt.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

CommandList.displayName = "CommandList"

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      onImageRequest: undefined as ((range: { from: number; to: number }) => void) | undefined,
      onPageLinkRequest: undefined as ((range: { from: number; to: number }) => void) | undefined,
      suggestion: {
        char: "/",
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    const onImageRequest = this.options.onImageRequest
    const onPageLinkRequest = this.options.onPageLinkRequest
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range, onImageRequest, onPageLinkRequest })
        },
        items: ({ query }: { query: string }) => {
          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null
          let popup: HTMLElement | null = null

          const positionPopup = (rect: DOMRect) => {
            if (!popup) return
            const menuHeight = 400 // tahmini maks yükseklik
            const menuWidth = 288 // w-72 = 18rem = 288px
            const padding = 8

            let top = rect.bottom + padding
            let left = rect.left

            // Alt taşma: menüyü yukarı aç
            if (top + menuHeight > window.innerHeight) {
              top = rect.top - menuHeight - padding
              if (top < 0) top = padding
            }

            // Sağ taşma
            if (left + menuWidth > window.innerWidth) {
              left = window.innerWidth - menuWidth - padding
            }

            // Sol taşma
            if (left < padding) left = padding

            popup.style.left = `${left}px`
            popup.style.top = `${top}px`
          }

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              popup = document.createElement("div")
              popup.style.position = "fixed"
              popup.style.zIndex = "50"
              document.body.appendChild(popup)

              if (props.clientRect) {
                const rect = props.clientRect()
                if (rect) positionPopup(rect)
              }

              popup.appendChild(component.element)
            },
            onUpdate: (props: any) => {
              component?.updateProps(props)
              if (popup && props.clientRect) {
                const rect = props.clientRect()
                if (rect) positionPopup(rect)
              }
            },
            onKeyDown: (props: any) => {
              if (props.event.key === "Escape") {
                popup?.remove()
                component?.destroy()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup?.remove()
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})
