import type { Metadata } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kotion",
  description: "Not defteriniz - Notion benzeri kişisel çalışma alanı",
  icons: {
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/*
          Safety net for rare ProseMirror position RangeErrors during concurrent
          edits. Position errors are handled locally in the editor; this only
          suppresses the dev error overlay for them and no longer calls
          stopImmediatePropagation, so other error listeners still run.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('error',function(e){if(e.error instanceof RangeError&&e.error.message.indexOf('Position')!==-1){e.preventDefault();}},true);`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="bottom-center" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
