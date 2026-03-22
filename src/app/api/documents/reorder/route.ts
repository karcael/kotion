import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// PATCH /api/documents/reorder — Sayfa sıralamasını güncelle
export async function PATCH(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { orderedIds } = await request.json()

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds dizisi gerekli" },
        { status: 400 }
      )
    }

    // Sıralama güncelle
    await Promise.all(
      orderedIds.map((id: string, index: number) =>
        prisma.document.updateMany({
          where: { id, userId: user.id },
          data: { position: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder error:", error)
    return NextResponse.json(
      { error: "Sıralama güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}
