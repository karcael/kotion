"use client"

import { useEffect, useRef, useState, useMemo, createElement } from "react"
import { icons } from "lucide-react"
import { ICON_COLORS, categorizeIcons } from "./page-icon"

// Genişletilmiş emoji seti
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Sık Kullanılan": [
    "📝", "📄", "📋", "📌", "📎", "🔖", "💡", "⭐", "🎯", "🚀",
    "💻", "🖥️", "📊", "📈", "📉", "🗂️", "📁", "📂", "🏠", "🏢",
    "✅", "❌", "⚡", "🔥", "💎", "🎨", "🛠️", "📦", "🔗", "💬",
  ],
  "Yüzler": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊",
    "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋",
    "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔",
    "🫡", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
    "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
    "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓",
    "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦",
    "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
    "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀",
    "💩", "🤡", "👹", "👻", "👽", "👾", "🤖", "🎃", "😺", "😸",
  ],
  "El Hareketleri": [
    "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌",
    "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉",
    "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛",
    "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💪",
  ],
  "Hayvanlar": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔",
    "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴",
    "🦄", "🐝", "🦋", "🐌", "🐞", "🐜", "🐢", "🐍", "🦎", "🦖",
    "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳",
    "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛",
  ],
  "Doğa": [
    "🌸", "🌺", "🌻", "🌹", "🌷", "🌱", "🌿", "☘️", "🍀", "🌳",
    "🌲", "🌴", "🌵", "🎋", "🪴", "🍁", "🍂", "🍃", "⛰️", "🏔️",
    "🌊", "🔥", "⚡", "☀️", "🌙", "⭐", "🌈", "🌍", "🌏", "🌎",
  ],
  "Yiyecek": [
    "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒",
    "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🌽",
    "🥕", "🍞", "🥐", "🧇", "🥞", "🧀", "🍳", "🥩", "🍗", "🍖",
    "🌭", "🍔", "🍟", "🍕", "🌮", "🌯", "🥗", "🍝", "🍜", "🍲",
    "🍛", "🍣", "🍱", "🥟", "🍤", "🍩", "🍪", "🎂", "🍰", "🧁",
    "🍫", "🍬", "🍭", "🍿", "☕", "🍵", "🍶", "🍺", "🍻", "🥂",
  ],
  "Aktiviteler": [
    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸",
    "🥊", "🥋", "🎿", "⛷️", "🏂", "🏋️", "🤸", "🎮", "🕹️", "🎲",
    "🧩", "🎰", "🎳", "🎯", "🎪", "🎭", "🎨", "🎼", "🎵", "🎶",
    "🎤", "🎧", "🎷", "🎸", "🎹", "🥁", "🎺", "🎻", "🪘", "🪗",
  ],
  "Seyahat": [
    "🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🛻", "🚚",
    "🏍️", "🛵", "🚲", "🛴", "✈️", "🚀", "🛸", "🚂", "🚆", "🚇",
    "⛵", "🚢", "🏗️", "🏠", "🏡", "🏢", "🏣", "🏥", "🏦", "🏨",
    "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "🗼", "🗽", "⛪", "🕌",
    "🗻", "🏕", "🌅", "🏖️", "🏝️", "🎆", "🎇", "🎑", "🌠", "🎡",
  ],
  "Nesneler": [
    "⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "💾", "💿", "📷", "📹",
    "🔍", "💡", "🔦", "📔", "📕", "📖", "📗", "📘", "📙", "📚",
    "📓", "📒", "📃", "📜", "📄", "📰", "📑", "🔖", "💰", "💴",
    "💵", "💶", "💷", "💸", "💳", "✉️", "📧", "📨", "📩", "📤",
    "📥", "📦", "📫", "📮", "✏️", "🖋️", "🖊️", "🖌️", "🖍️", "📝",
    "📁", "📂", "🗂️", "📅", "📆", "📇", "📈", "📉", "📊", "📋",
    "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗑️", "🔒", "🔓",
    "🔑", "🗝️", "🔨", "🛠️", "⚙️", "🔧", "🔩", "🔗", "⛓️", "🧰",
  ],
  "Semboller": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️",
    "💯", "✅", "☑️", "✔️", "❌", "❎", "➕", "➖", "➗", "✖️",
    "♾️", "‼️", "⁉️", "❓", "❔", "❕", "❗", "🔴", "🟠", "🟡",
    "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩",
    "🟦", "🟪", "🟫", "⬛", "⬜", "◼️", "◻️", "🏁", "🚩", "🏳️‍🌈",
  ],
  "Bayraklar": [
    "🇹🇷", "🇺🇸", "🇬🇧", "🇩🇪", "🇫🇷", "🇪🇸", "🇮🇹", "🇯🇵", "🇰🇷", "🇨🇳",
    "🇷🇺", "🇧🇷", "🇦🇺", "🇨🇦", "🇮🇳", "🇲🇽", "🇦🇷", "🇸🇦", "🇦🇪", "🇳🇱",
  ],
}

interface IconPickerProps {
  onSelect: (icon: string) => void
  onClose: () => void
}

export function IconPicker({ onSelect, onClose }: IconPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<"emoji" | "icons">("emoji")
  const [search, setSearch] = useState("")
  const [selectedColor, setSelectedColor] = useState(ICON_COLORS[5].value)

  const lucideCategories = useMemo(() => categorizeIcons(), [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Lucide ikon arama filtresi
  const filteredLucide = useMemo(() => {
    if (!search.trim()) return lucideCategories
    const q = search.toLowerCase()
    const result: Record<string, string[]> = {}
    for (const [cat, names] of Object.entries(lucideCategories)) {
      const filtered = names.filter(
        (n) => n.toLowerCase().includes(q) || cat.toLowerCase().includes(q)
      )
      if (filtered.length > 0) result[cat] = filtered
    }
    return result
  }, [search, lucideCategories])

  const renderLucideIcon = (name: string, size: number, color: string) => {
    const Comp = icons[name as keyof typeof icons]
    if (!Comp) return null
    return createElement(Comp as any, { size, color, strokeWidth: 2 })
  }

  return (
    <div
      ref={ref}
      className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl"
    >
      {/* Sekmeler */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => { setTab("emoji"); setSearch("") }}
          className={`flex-1 cursor-pointer px-4 py-2.5 text-[13px] font-medium transition-colors ${
            tab === "emoji"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          😀 Emoji
        </button>
        <button
          onClick={() => { setTab("icons"); setSearch("") }}
          className={`flex-1 cursor-pointer px-4 py-2.5 text-[13px] font-medium transition-colors ${
            tab === "icons"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ✦ İkonlar
          <span className="ml-1 text-[10px] text-muted-foreground/50">1700+</span>
        </button>
      </div>

      {/* Arama */}
      <div className="p-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "emoji" ? "Emoji ara..." : "İkon ara (ör: home, star, lock)..."}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
          autoFocus
        />
      </div>

      {/* Renk seçici (ikonlar sekmesi) */}
      {tab === "icons" && (
        <div className="flex items-center gap-1.5 px-3 pb-2">
          <span className="mr-1 text-[10px] text-muted-foreground/60">Renk:</span>
          {ICON_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              title={color.name}
              className={`h-5 w-5 cursor-pointer rounded-full transition-all ${
                selectedColor === color.value
                  ? "ring-2 ring-offset-2 ring-offset-popover scale-110"
                  : "hover:scale-110"
              }`}
              style={{
                backgroundColor: color.value,
                outlineColor: selectedColor === color.value ? color.value : undefined,
              }}
            />
          ))}
        </div>
      )}

      {/* İçerik */}
      <div className="max-h-72 overflow-y-auto px-3 pb-2">
        {tab === "emoji" && (
          <>
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => {
              const q = search.toLowerCase()
              const filtered = search
                ? emojis.filter(() => category.toLowerCase().includes(q))
                : emojis
              if (filtered.length === 0) return null

              return (
                <div key={category} className="mb-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {category}
                  </p>
                  <div className="grid grid-cols-10 gap-0.5">
                    {filtered.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => onSelect(emoji)}
                        className="flex cursor-pointer items-center justify-center rounded-lg p-1 text-[18px] transition-all duration-100 hover:scale-110 hover:bg-foreground/5 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tab === "icons" && (
          <>
            {Object.entries(filteredLucide).map(([category, iconNames]) => (
              <div key={category} className="mb-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {category}
                  <span className="ml-1 normal-case tracking-normal text-muted-foreground/30">
                    ({iconNames.length})
                  </span>
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {iconNames.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => onSelect(`lucide:${iconName}:${selectedColor}`)}
                      title={iconName}
                      className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-all duration-100 hover:scale-110 hover:bg-foreground/5 active:scale-95"
                    >
                      {renderLucideIcon(iconName, 18, selectedColor)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(filteredLucide).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sonuç bulunamadı
              </p>
            )}
          </>
        )}
      </div>

      {/* Alt buton */}
      <div className="border-t border-border/60 p-2">
        <button
          onClick={() => onSelect("")}
          className="w-full cursor-pointer rounded-xl py-1.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          İkonu Kaldır
        </button>
      </div>
    </div>
  )
}
