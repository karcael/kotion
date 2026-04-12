"use client"

import { useState, useCallback } from "react"
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { Check, Copy, ChevronDown } from "lucide-react"

const LANGUAGES = [
  { value: "", label: "Otomatik" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
]

export function CodeBlockComponent({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [showLangs, setShowLangs] = useState(false)

  const currentLang = node.attrs.language || ""
  const label =
    LANGUAGES.find((l) => l.value === currentLang)?.label || currentLang || "Otomatik"

  const handleCopy = useCallback(() => {
    const text = node.textContent
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [node])

  const handleLanguageChange = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang })
      setShowLangs(false)
    },
    [updateAttributes],
  )

  return (
    <NodeViewWrapper className="code-block-wrapper">
      {/* Toolbar */}
      <div className="code-block-toolbar" contentEditable={false}>
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangs(!showLangs)}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            {label}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showLangs && (
            <>
              <div
                className="fixed inset-0 z-[99]"
                onClick={() => setShowLangs(false)}
              />
              <div className="absolute left-0 top-full z-[100] mt-1 max-h-64 w-44 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`flex w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      currentLang === lang.value
                        ? "bg-accent/10 font-medium text-accent"
                        : "text-foreground/80 hover:bg-foreground/5"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Kopyala
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre>
        <NodeViewContent as={"code" as any} />
      </pre>
    </NodeViewWrapper>
  )
}
