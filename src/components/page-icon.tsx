"use client"

import { createElement } from "react"
import { icons, FileText } from "lucide-react"

// İkon renkleri
export const ICON_COLORS = [
  { name: "Gri", value: "#787774" },
  { name: "Kahverengi", value: "#9F6B53" },
  { name: "Turuncu", value: "#D9730D" },
  { name: "Sarı", value: "#CB912F" },
  { name: "Yeşil", value: "#448361" },
  { name: "Mavi", value: "#337EA9" },
  { name: "Mor", value: "#9065B0" },
  { name: "Pembe", value: "#C14C8A" },
  { name: "Kırmızı", value: "#D44C47" },
]

const KEYWORD_MAP: Record<string, string[]> = {
  "Oklar ve Yönler": ["arrow", "chevron", "move", "corner", "align", "minimize", "maximize", "expand", "shrink", "flip", "iterate", "undo", "redo", "rotate", "refresh", "repeat"],
  "Dosya ve Belge": ["file", "folder", "clipboard", "document", "book", "notebook", "page", "newspaper", "scroll", "sticky", "archive", "save", "download", "upload"],
  "İletişim": ["mail", "message", "phone", "send", "inbox", "at", "contact", "chat", "comment", "reply", "forward", "voicemail"],
  "Medya": ["image", "camera", "video", "film", "music", "headphone", "mic", "speaker", "play", "pause", "volume", "radio", "tv", "screen", "podcast", "disc", "aperture"],
  "Hava ve Doğa": ["sun", "moon", "cloud", "rain", "snow", "wind", "umbrella", "rainbow", "star", "sparkle", "flame", "wave", "leaf", "flower", "tree", "mountain", "zap", "tornado", "droplet"],
  "Araçlar": ["car", "truck", "bus", "train", "plane", "ship", "bike", "rocket", "fuel", "map", "compass", "navigation", "route", "globe", "anchor", "sailboat"],
  "Şekiller": ["circle", "square", "triangle", "diamond", "hexagon", "octagon", "pentagon", "heart", "badge", "ribbon"],
  "Cihazlar": ["monitor", "laptop", "tablet", "smartphone", "watch", "cpu", "server", "database", "hard", "wifi", "bluetooth", "usb", "plug", "battery", "signal", "cable", "circuit"],
  "Ev ve Bina": ["house", "home", "building", "store", "hospital", "school", "church", "castle", "warehouse", "factory", "hotel", "landmark", "door", "window", "bed", "bath", "sofa", "lamp", "armchair"],
  "Yiyecek ve İçecek": ["coffee", "pizza", "apple", "cherry", "grape", "cake", "cookie", "egg", "milk", "wine", "beer", "cup", "glass", "utensil", "sandwich", "salad", "ice", "candy", "popcorn", "soup", "beef", "ham", "fish", "citrus", "banana", "nut", "croissant", "carrot", "wheat"],
  "Sağlık": ["heart-pulse", "pill", "stethoscope", "syringe", "thermometer", "cross", "ambulance", "brain", "bone", "dna", "microscope", "activity"],
  "Finans": ["dollar", "credit", "wallet", "coins", "banknote", "receipt", "piggy", "percent", "trending", "calculator", "bitcoin", "euro", "pound"],
  "Güvenlik": ["lock", "unlock", "shield", "key", "eye", "fingerprint", "scan", "alert", "siren", "bug", "verified"],
  "Düzenleme": ["pen", "pencil", "eraser", "brush", "paint", "palette", "scissors", "ruler", "wand", "type", "italic", "bold", "underline", "highlight", "text", "heading", "list", "table", "code", "terminal", "bracket", "hash", "regex", "spell", "baseline"],
  "Grafik ve Veri": ["chart", "bar", "pie", "line", "gauge", "kanban", "gantt", "calendar", "clock", "timer", "hourglass", "history"],
  "Navigasyon": ["menu", "sidebar", "panel", "layout", "grid", "columns", "rows", "split", "fullscreen", "filter", "sort", "search", "zoom"],
  "Sosyal ve İnsan": ["user", "users", "person", "group", "hand", "thumbs", "share", "link", "external", "baby", "accessibility"],
  "Eğitim": ["graduation", "school", "library", "lightbulb", "puzzle", "award", "trophy", "medal", "crown", "gem", "target", "goal", "flag"],
}

export function categorizeIcons(): Record<string, string[]> {
  const allNames = Object.keys(icons)
  const result: Record<string, string[]> = {}
  for (const cat of Object.keys(KEYWORD_MAP)) result[cat] = []
  result["Diğer"] = []

  allNames.forEach((name) => {
    const lower = name.toLowerCase()
    let placed = false
    for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        result[cat].push(name)
        placed = true
        break
      }
    }
    if (!placed) result["Diğer"].push(name)
  })

  for (const cat of Object.keys(result)) {
    if (result[cat].length === 0) delete result[cat]
  }
  return result
}

export function parseIcon(icon: string | null) {
  if (!icon) return { type: null as null, value: "" }
  if (icon.startsWith("lucide:")) {
    const parts = icon.split(":")
    return { type: "lucide" as const, value: icon, iconName: parts[1], color: parts[2] || "#787774" }
  }
  if (icon.startsWith("/") || icon.startsWith("http")) {
    return { type: "image" as const, value: icon }
  }
  return { type: "emoji" as const, value: icon }
}

export function PageIcon({
  icon,
  size = 18,
  className = "",
}: {
  icon: string | null
  size?: number
  className?: string
}) {
  const parsed = parseIcon(icon)

  if (!parsed.type) {
    return <FileText style={{ width: size, height: size }} className={`opacity-50 ${className}`} />
  }

  if (parsed.type === "image") {
    return <img src={parsed.value} alt="" className={`rounded-sm object-cover ${className}`} style={{ width: size, height: size }} />
  }

  if (parsed.type === "lucide") {
    const Comp = icons[parsed.iconName as keyof typeof icons]
    if (!Comp) return <FileText style={{ width: size, height: size }} className={`opacity-50 ${className}`} />
    return createElement(Comp as any, { size, color: parsed.color, strokeWidth: 2, className })
  }

  return <span className={`leading-none ${className}`} style={{ fontSize: size }}>{parsed.value}</span>
}
