import { prisma } from "./prisma"

export type DocumentRole = "OWNER" | "EDITOR" | "VIEWER"

interface DocumentWithAccess {
  document: {
    id: string
    title: string
    content: unknown
    icon: string | null
    coverImage: string | null
    isArchived: boolean
    isFavorite: boolean
    isPublished: boolean
    parentId: string | null
    userId: string
    createdAt: Date
    updatedAt: Date
  }
  role: DocumentRole
}

/**
 * Belge erişim kontrolü: sahip, işbirlikçi veya üst sayfa zinciri yoluyla erişim.
 */
export async function getDocumentWithAccess(
  documentId: string,
  userId: string
): Promise<DocumentWithAccess | null> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!document) return null

  // Sahip mi?
  if (document.userId === userId) {
    return { document, role: "OWNER" }
  }

  // Doğrudan işbirlikçi mi?
  const collab = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId, userId } },
  })

  if (collab) {
    return { document, role: collab.role as DocumentRole }
  }

  // Üst sayfa zincirinde erişim var mı?
  const ancestorAccess = await checkAncestorAccess(document.parentId, userId)
  if (ancestorAccess) {
    return { document, role: ancestorAccess }
  }

  return null
}

/**
 * Üst sayfa zincirini yukarı doğru tarayarak işbirlikçi erişimini kontrol eder.
 */
async function checkAncestorAccess(
  parentId: string | null,
  userId: string,
  depth = 0
): Promise<DocumentRole | null> {
  if (!parentId || depth > 20) return null

  const parent = await prisma.document.findUnique({
    where: { id: parentId },
    select: { userId: true, parentId: true, id: true },
  })

  if (!parent) return null

  // Üst sayfanın sahibi mi?
  if (parent.userId === userId) return "OWNER"

  // Üst sayfada işbirlikçi mi?
  const collab = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId: parent.id, userId } },
  })

  if (collab) return collab.role as DocumentRole

  // Daha yukarı bak
  return checkAncestorAccess(parent.parentId, userId, depth + 1)
}

/**
 * Collects the parent chain of a document, root first, excluding the document
 * itself. Bounded depth to guard against cycles.
 */
export async function getAncestors(
  parentId: string | null,
  userId: string
): Promise<{ id: string; title: string; icon: string | null }[]> {
  const chain: { id: string; title: string; icon: string | null }[] = []
  let currentId = parentId
  let depth = 0
  while (currentId && depth < 50) {
    const parent = await prisma.document.findUnique({
      where: { id: currentId },
      select: { id: true, title: true, icon: true, parentId: true },
    })
    if (!parent) break
    // Only include ancestors the user can actually access; stop at the first
    // inaccessible one so the breadcrumb never leaks hidden parent metadata.
    const access = await getDocumentWithAccess(parent.id, userId)
    if (!access) break
    chain.push({ id: parent.id, title: parent.title, icon: parent.icon })
    currentId = parent.parentId
    depth++
  }
  return chain.reverse()
}

/**
 * Kullanıcının erişebildiği paylaşılan belgeleri listeler.
 */
export async function getSharedDocuments(userId: string) {
  const collaborations = await prisma.collaborator.findMany({
    where: { userId },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          icon: true,
          coverImage: true,
          isArchived: true,
          isFavorite: true,
          isPublished: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { children: true } },
        },
      },
    },
  })

  return collaborations
    .filter((c) => !c.document.isArchived)
    .map((c) => ({
      ...c.document,
      role: c.role,
      ownerName: c.document.user.name,
    }))
}
