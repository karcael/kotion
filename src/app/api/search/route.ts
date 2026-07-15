import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { buildSnippet } from "@/lib/search-snippet"

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()
    if (!query) return NextResponse.json([])

    const documents = await prisma.document.findMany({
      where: {
        isArchived: false,
        OR: [
          { userId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
        AND: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { contentText: { contains: query, mode: "insensitive" } },
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        icon: true,
        parentId: true,
        contentText: true,
      },
    })

    const results = documents.map((doc) => {
      const contentSnippet = doc.contentText
        ? buildSnippet(doc.contentText, query)
        : null
      return {
        id: doc.id,
        title: doc.title,
        icon: doc.icon,
        parentId: doc.parentId,
        snippet: contentSnippet,
        // If there is no content snippet, the row matched on the title.
        matchedIn: contentSnippet ? ("content" as const) : ("title" as const),
      }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Arama sırasında bir hata oluştu." },
      { status: 500 }
    )
  }
}
