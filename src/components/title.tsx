"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { useDebounce } from "@/hooks/use-debounce"

interface TitleProps {
  initialTitle: string
  onChange: (title: string) => void
}

export function Title({ initialTitle, onChange }: TitleProps) {
  const [title, setTitle] = useState(initialTitle)
  const debouncedTitle = useDebounce(title, 500)
  const onChangeRef = useRef(onChange)
  const lastSavedRef = useRef(initialTitle)

  // onChange referansını güncel tut ama effect'i tetikleme
  onChangeRef.current = onChange

  // Prop değişikliklerini senkronize et (sayfa geçişlerinde)
  useEffect(() => {
    setTitle(initialTitle)
    lastSavedRef.current = initialTitle
  }, [initialTitle])

  // Sadece kullanıcı yazdığında ve değer değiştiğinde kaydet
  useEffect(() => {
    if (debouncedTitle === lastSavedRef.current) return
    lastSavedRef.current = debouncedTitle
    onChangeRef.current(debouncedTitle)
  }, [debouncedTitle])

  return (
    <TextareaAutosize
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Adsız"
      className="w-full resize-none break-words bg-transparent text-4xl font-bold outline-none placeholder:text-foreground/25"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          const editor = window.document.querySelector(".ProseMirror")
          if (editor instanceof HTMLElement) {
            editor.focus()
          }
        }
      }}
    />
  )
}
