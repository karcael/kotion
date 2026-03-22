import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

type RouteParams = { params: Promise<{ invitationId: string }> }

// PATCH /api/invitations/[invitationId] — Onayla veya reddet
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { invitationId } = await params
    const { status } = await request.json()

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz durum. ACCEPTED veya DECLINED olmalı" },
        { status: 400 }
      )
    }

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        OR: [{ inviteeId: user.id }, { email: user.email }],
        status: "PENDING",
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Davet bulunamadı" },
        { status: 404 }
      )
    }

    if (status === "ACCEPTED") {
      // İşbirlikçi kaydı oluştur
      await prisma.collaborator.upsert({
        where: {
          documentId_userId: {
            documentId: invitation.documentId,
            userId: user.id,
          },
        },
        create: {
          documentId: invitation.documentId,
          userId: user.id,
          role: invitation.role,
        },
        update: {
          role: invitation.role,
        },
      })
    }

    // Davet durumunu güncelle
    const updated = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: status as "ACCEPTED" | "DECLINED",
        inviteeId: user.id,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update invitation error:", error)
    return NextResponse.json(
      { error: "Davet güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[invitationId] — Daveti iptal et (gönderen tarafından)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { invitationId } = await params

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        inviterId: user.id,
        status: "PENDING",
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Davet bulunamadı veya iptal edilemez" },
        { status: 404 }
      )
    }

    await prisma.invitation.delete({
      where: { id: invitationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete invitation error:", error)
    return NextResponse.json(
      { error: "Davet iptal edilirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
