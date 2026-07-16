# Kotion API Reference

REST API for Kotion, a self-hosted Notion clone built on Next.js 16 (App Router).
All routes live under `src/app/api/` and return JSON unless stated otherwise.

Version: 1.5.0. Additions introduced in v1.5 are marked with **[v1.5]**.

---

## Table of Contents

- [Authentication Model](#authentication-model)
- [Common Conventions](#common-conventions)
- [Auth](#auth)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [POST /api/auth/logout](#post-apiauthlogout)
  - [GET /api/auth/me](#get-apiauthme)
- [Documents](#documents)
  - [GET /api/documents](#get-apidocuments)
  - [POST /api/documents](#post-apidocuments)
  - [GET /api/documents/{documentId}](#get-apidocumentsdocumentid)
  - [PATCH /api/documents/{documentId}](#patch-apidocumentsdocumentid)
  - [DELETE /api/documents/{documentId}](#delete-apidocumentsdocumentid)
  - [PATCH /api/documents/reorder](#patch-apidocumentsreorder)
- [Collaborators](#collaborators)
  - [GET /api/documents/{documentId}/collaborators](#get-apidocumentsdocumentidcollaborators)
  - [DELETE /api/documents/{documentId}/collaborators](#delete-apidocumentsdocumentidcollaborators)
- [Invitations](#invitations)
  - [POST /api/invitations](#post-apiinvitations)
  - [GET /api/invitations](#get-apiinvitations)
  - [PATCH /api/invitations/{invitationId}](#patch-apiinvitationsinvitationid)
  - [DELETE /api/invitations/{invitationId}](#delete-apiinvitationsinvitationid)
- [Search](#search)
  - [GET /api/search](#get-apisearch)
- [Files & Upload](#files--upload)
  - [POST /api/upload](#post-apiupload)
  - [GET /api/files/{...path}](#get-apifilespath)
- [Access-Scope Rules](#access-scope-rules)
- [Data Model Reference](#data-model-reference)

---

## Authentication Model

Authentication is stateless, based on a signed JWT stored in an **httpOnly cookie**.

- **Cookie name:** `kotion-token`
- **Token:** JWT signed with HS256 (`jose`), payload `{ userId, email }`, issued-at set, **7-day expiration**.
- **Cookie flags:** `httpOnly`, `path=/`, `sameSite=lax`, `secure` only when `NODE_ENV=production`, `maxAge` = 7 days.

### Middleware (`src/middleware.ts`)

A global middleware enforces auth before requests reach handlers. Its matcher covers
everything except `_next/static`, `_next/image`, `favicon.ico`, and **`/api/files`**.

| Path pattern | Behavior |
| --- | --- |
| `/` | Redirect to `/documents` if the token is valid, otherwise to `/login`. |
| `/login`, `/register` | Redirect to `/documents` if the token is valid; otherwise render the page. |
| `/api/auth/*` | **Public** - passed through without a token check. |
| Any other `/api/*` | If no token or invalid/expired token, return **401 JSON** (does not redirect). |
| Any other page | If no token or invalid/expired token, **redirect to `/login`**. |

The two distinct 401 bodies returned by middleware for protected API routes:

- No token present: `{ "error": "Yetkisiz erişim." }`
- Token present but invalid/expired: `{ "error": "Oturum süresi doldu." }`

**Notes**

- `/api/auth/*` is exempt from middleware auth. `/api/auth/me` still requires a valid
  session because its handler calls `getSession()` itself and returns 401 if absent.
- `/api/files/*` is **excluded from the middleware matcher** and performs its **own**
  cookie/JWT verification inside the handler (see that endpoint).
- Every protected handler also re-checks `getSession()` as defense in depth, returning
  `401 { "error": "Yetkisiz erişim." }` if the session is missing.

---

## Common Conventions

- **Content type:** requests and responses are `application/json`, except `POST /api/upload`
  (multipart form data) and `GET /api/files/*` (binary image).
- **Error shape:** `{ "error": "<message>" }`. Error messages are in Turkish.
- **500** is returned by every handler on an unexpected exception (`{ "error": "..." }`).
- **Roles:** stored collaborator roles are `EDITOR` and `VIEWER` (Prisma enum
  `CollaboratorRole`). `OWNER` is a **derived** role returned by the access layer when the
  requesting user owns the document; it is never stored.
- **Session user object** (`getSession()`) is `{ id, name, email, image }`.

---

## Auth

### POST /api/auth/register

Create a new user account and sign them in.

- **Auth:** none (public).
- **Body:**

  | Field | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `name` | string | yes | Trimmed before saving. |
  | `email` | string | yes | Normalized (trim + lowercase); must match a basic email regex. |
  | `password` | string | yes | Minimum 6 characters. Hashed with bcrypt (cost 12). |

- **Responses:**
  - `201` - `{ "user": { "id", "name", "email" } }`; sets the `kotion-token` cookie.
  - `400` - missing fields (`"Tüm alanları doldurun."`), invalid email
    (`"Geçerli bir e-posta adresi girin."`), or password shorter than 6
    (`"Şifre en az 6 karakter olmalıdır."`).
  - `409` - email already registered (`"Bu e-posta adresi zaten kullanılıyor."`).
  - `500` - server error.

- **Side effects:** creates a `User` row; issues a 7-day session cookie.

---

### POST /api/auth/login

Authenticate an existing user.

- **Auth:** none (public).
- **Body:** `{ "email": string, "password": string }` (both required). Email is normalized
  (trim + lowercase).
- **Responses:**
  - `200` - `{ "user": { "id", "name", "email" } }`; sets the `kotion-token` cookie.
  - `400` - missing email or password (`"E-posta ve şifre gereklidir."`).
  - `401` - invalid credentials (`"Geçersiz e-posta veya şifre."`).
  - `500` - server error.

- **Security note:** the handler runs `bcrypt.compare` against a constant dummy hash when the
  user is not found, so response timing does not reveal whether an email is registered
  (mitigates timing-based user enumeration).

---

### POST /api/auth/logout

Clear the session cookie.

- **Auth:** none (public route; effectively idempotent).
- **Body:** none.
- **Responses:** `200` - `{ "success": true }`; overwrites `kotion-token` with an empty value
  and `maxAge=0`.

---

### GET /api/auth/me

Return the currently authenticated user. Used by the client for periodic session validation.

- **Auth:** required (enforced by the handler via `getSession()`, not by middleware).
- **Body / params:** none.
- **Responses:**
  - `200` - `{ "user": { "id", "name", "email", "image" } }`.
  - `401` - no active session (`"Oturum bulunamadı."`).
  - `500` - server error.

---

## Documents

A `Document` has: `id`, `title`, `content` (Tiptap JSON), `contentText` (plain-text mirror of
content used for search), `icon`, `coverImage`, `isArchived`, `isFavorite`, `isPublished`,
`position`, `parentId`, `userId`, `createdAt`, `updatedAt`.

### GET /api/documents

List documents. Behavior is selected by query flags; the first matching branch wins in this
order: `shared` → `all` → `recent` → default.

- **Auth:** required.
- **Query params:**

  | Param | Type | Effect |
  | --- | --- | --- |
  | `shared` | `true` | Return documents shared **with** the user (where they are a collaborator). |
  | `all` | `true` | Return all of the user's non-archived documents (flat), minimal fields - used by the page-link dialog. |
  | `recent` | `true` | **[v1.5]** Return the 6 most recently updated documents the user owns or collaborates on. |
  | `parentId` | string | Return non-archived children of that parent (default branch). |
  | `favorites` | `true` | Return the user's favorite, non-archived documents (default branch). |
  | `archived` | `true` | Return the user's archived documents, flat (default branch). |
  | *(none)* | - | Return the user's non-archived **root** documents (`parentId = null`). |

- **Responses (`200`):** always a JSON **array**. Shape depends on the branch:

  - **`shared=true`** - each item: `{ id, title, icon, coverImage, isArchived, isFavorite,
    isPublished, parentId, createdAt, updatedAt, user: { name, email }, _count: { children },
    role, ownerName }`. Only non-archived shared docs are included; `role` is the caller's
    collaborator role and `ownerName` is the owner's name. Here `_count.children` counts **all**
    children.

  - **`all=true`** - each item: `{ id, title, icon, parentId }`, ordered by `createdAt` asc.

  - **`recent=true` [v1.5]** - each item: `{ id, title, icon, updatedAt, parentId }`, ordered by
    `updatedAt` desc, max 6.

  - **default (parentId / favorites / archived / root)** - each item: `{ id, title, icon,
    coverImage, isArchived, isFavorite, isPublished, parentId, createdAt, updatedAt, position,
    _count: { children } }`, ordered by `position` asc then `createdAt` asc. Here
    `_count.children` counts only **non-archived** children (so an emptied trashed page does not
    show a stray expand arrow).

- `500` - server error.

- **Scope:** `shared` and `recent` include documents where the user is owner **or** a direct
  collaborator. All other branches are restricted to documents the user **owns** (`userId`).

---

### POST /api/documents

Create a document (optionally as a child of an existing page).

- **Auth:** required.
- **Body:**

  | Field | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `title` | string | no | Defaults to `"Adsız"`. |
  | `parentId` | string | no | If set, caller must have at least EDITOR access to the parent. |
  | `content` | Tiptap JSON | no | If present, `contentText` is derived and stored alongside it. |
  | `icon` | string | no | Emoji / icon identifier. |

- **Responses:**
  - `201` - the full created `Document` object.
  - `403` - `parentId` was supplied but the caller has no access, or only VIEWER access, to it
    (`"Üst sayfaya erişim yetkiniz yok."`). Prevents cross-tenant nesting under someone else's page.
  - `401` / `500`.

---

### GET /api/documents/{documentId}

Fetch a single document with the caller's role and its breadcrumb chain.

- **Auth:** required.
- **Path param:** `documentId`.
- **Responses:**
  - `200` - the full `Document` plus:
    - `role` - the caller's derived role (`OWNER` | `EDITOR` | `VIEWER`).
    - `ancestors` **[v1.5]** - array of `{ id, title, icon }` from root down to the immediate
      parent (excludes the document itself). **Access-filtered:** the walk stops at the first
      ancestor the caller cannot access, so hidden parent metadata is never leaked.
  - `404` - no access or not found (`"Doküman bulunamadı."`).
  - `401` / `500`.

- **Access:** granted if the caller owns the document, is a direct collaborator, **or** has
  access via any ancestor in the parent chain (see [Access-Scope Rules](#access-scope-rules)).

---

### PATCH /api/documents/{documentId}

Update document fields; also handles archive/restore cascades.

- **Auth:** required.
- **Path param:** `documentId`.
- **Body:** any subset of the allowed fields: `title`, `content`, `icon`, `coverImage`,
  `isArchived`, `isFavorite`, `isPublished`. Unknown fields are ignored. When `content` is
  present, `contentText` is recomputed automatically.
- **Permission rules:**
  - No access → `404`.
  - `VIEWER` → `403` (`"Düzenleme yetkiniz yok."`) - cannot edit at all.
  - `isArchived`, `isFavorite`, `isPublished` are **owner-only**: a non-OWNER including any of
    these → `403` (`"Bu işlem için sahip olmanız gerekiyor."`).
- **Cascade behavior (transactional):**
  - `isArchived: true` → the document **and its entire descendant subtree** are archived in one
    transaction.
  - `isArchived: false` (restore) when the document has a parent → any archived **ancestors** up
    the chain are restored together in one transaction, so the page becomes reachable again.
  - Otherwise → a plain single-row update.
- **Responses:** `200` - the updated `Document`. `401` / `403` / `404` / `500`.

---

### DELETE /api/documents/{documentId}

Permanently delete a document and its subtree.

- **Auth:** required.
- **Path param:** `documentId`.
- **Permission:** **OWNER only.** Non-owner (including collaborators) → `403`
  (`"Silme yetkisi sadece sayfa sahibine aittir."`). No access → `404`.
- **Behavior:** deletes the document plus **all descendants** in a single `deleteMany`
  (atomic). Descendant IDs are gathered breadth-first, bounded to 100 levels.
- **Responses:** `200` - `{ "success": true }`. `401` / `403` / `404` / `500`.

---

### PATCH /api/documents/reorder

Persist the sibling ordering of pages after a drag-and-drop.

- **Auth:** required.
- **Body:** `{ "orderedIds": string[] }` - document IDs in their new order.
- **Behavior:** sets `position = index` for each ID, **scoped to the caller's own documents**
  (`updateMany` filtered by `userId`); IDs owned by others are silently skipped.
- **Responses:**
  - `200` - `{ "success": true }`.
  - `400` - `orderedIds` is not an array of strings (`"orderedIds bir string dizisi olmalı."`).
  - `401` / `500`.

---

## Collaborators

### GET /api/documents/{documentId}/collaborators

List a document's collaborators and pending invitations.

- **Auth:** required.
- **Path param:** `documentId`.
- **Permission:** **OWNER only** - collaborator and invite emails are treated as sensitive.
  Non-owner (even with access) → `403` (`"Bu işlem için sahip olmanız gerekiyor."`).
  No access → `404`.
- **Responses (`200`):**

  ```json
  {
    "owner": { "id": "<userId>" },
    "collaborators": [
      { "id", "userId", "name", "email", "role" }
    ],
    "pendingInvitations": [
      { "id", "email", "role", "status", "createdAt" }
    ]
  }
  ```

  `pendingInvitations` only includes invitations with `status = PENDING`.
- `401` / `500`.

---

### DELETE /api/documents/{documentId}/collaborators

Remove a collaborator from a document.

- **Auth:** required.
- **Path param:** `documentId`.
- **Query param:** `userId` (required) - the collaborator to remove.
- **Permission:** **strict owner** - verified by looking up the document with
  `id = documentId AND userId = caller`. Not owner → `403` (`"Yetkiniz yok."`). Ancestor-based
  access does **not** qualify here.
- **Behavior:** deletes the matching `Collaborator` row(s) and also deletes any `Invitation`
  for that document addressed to the removed user's email, so a removed user is not left with a
  stale accepted/pending invite.
- **Responses:**
  - `200` - `{ "success": true }`.
  - `400` - missing `userId` (`"Kaldırılacak kullanıcı ID gerekli."`).
  - `401` / `403` / `500`.

---

## Invitations

An `Invitation` links a document, an inviter, an email, an optional resolved invitee user, a
`role` (`EDITOR` | `VIEWER`), and a `status` (`PENDING` | `ACCEPTED` | `DECLINED`).
`(documentId, email)` is unique.

### POST /api/invitations

Invite someone (by email) to collaborate on a document.

- **Auth:** required.
- **Body:**

  | Field | Type | Required | Notes |
  | --- | --- | --- | --- |
  | `documentId` | string | yes | Caller must own this document. |
  | `email` | string | yes | Normalized (trim + lowercase). |
  | `role` | `"EDITOR"` \| `"VIEWER"` | no | Defaults to `EDITOR`. |

- **Permission:** **strict owner** of `documentId` (verified via `id + userId`). Otherwise `404`
  (`"Doküman bulunamadı veya yetkiniz yok."`).
- **Behavior:**
  - Resolves the invitee to an existing user by email if one exists (stored as `inviteeId`).
  - If an invitation for `(documentId, email)` already exists:
    - `status = ACCEPTED` → `409` (`"Bu kişi zaten işbirlikçi."`).
    - otherwise → the existing invite is reset to `PENDING` with the new `role` and returned
      (`200`).
  - Otherwise a new invitation is created (`201`).
- **Responses:**
  - `201` - new `Invitation` created.
  - `200` - existing pending invitation updated.
  - `400` - missing `documentId`/`email`, invalid `role` (`"Geçersiz rol."`), or inviting
    yourself (`"Kendinizi davet edemezsiniz."`).
  - `404` - not the owner. `401` / `500`.

---

### GET /api/invitations

List the current user's incoming pending invitations.

- **Auth:** required.
- **Params:** none.
- **Behavior:** returns invitations with `status = PENDING` where `inviteeId = caller` **or**
  `email = caller's email`, ordered by `createdAt` desc.
- **Responses (`200`):** array of `Invitation` objects, each including
  `document: { id, title, icon }` and `inviter: { name, email }`.
- `401` / `500`.

---

### PATCH /api/invitations/{invitationId}

Accept or decline an invitation addressed to the caller.

- **Auth:** required.
- **Path param:** `invitationId`.
- **Body:** `{ "status": "ACCEPTED" | "DECLINED" }`.
- **Behavior:**
  - The invitation must be `PENDING` and addressed to the caller (`inviteeId = caller` or
    `email = caller`), else `404`.
  - On `ACCEPTED`: a `Collaborator` row is **upserted** for `(documentId, caller)` with the
    invitation's `role`.
  - The invitation's `status` is updated and `inviteeId` is set to the caller (binds an
    email-only invite to the accepting account).
- **Responses:**
  - `200` - the updated `Invitation`.
  - `400` - status not `ACCEPTED`/`DECLINED`
    (`"Geçersiz durum. ACCEPTED veya DECLINED olmalı."`).
  - `404` - invitation not found / not addressed to caller / not pending. `401` / `500`.

---

### DELETE /api/invitations/{invitationId}

Cancel an invitation you sent.

- **Auth:** required.
- **Path param:** `invitationId`.
- **Permission:** the caller must be the **inviter** and the invitation must be `PENDING`, else
  `404` (`"Davet bulunamadı veya iptal edilemez."`).
- **Responses:** `200` - `{ "success": true }`. `401` / `404` / `500`.

---

## Search

### GET /api/search

Full-text search across the caller's accessible documents. **[v1.5]** now matches document
**content** in addition to titles and returns snippets.

- **Auth:** required.
- **Query param:** `q` - the search string (trimmed). If empty or missing, returns `[]`.
- **Behavior:**
  - Matches non-archived documents where the caller is the **owner or a direct collaborator**
    and where **`title` OR `contentText`** contains `q` (case-insensitive).
  - Ordered by `updatedAt` desc, capped at **20** results.
  - For each hit, a `snippet` is built from `contentText` (a ~75-char window around the first
    match, snapped to word boundaries, with ellipses; plain text, no HTML). `matchedIn` is
    `"content"` when a content snippet exists, otherwise `"title"`.
- **Responses (`200`):** array of
  `{ id, title, icon, parentId, snippet, matchedIn }` where `snippet` is a string or `null` and
  `matchedIn` is `"content"` | `"title"`.
- `401` / `500`.

- **Scope note:** search uses the **owner + direct collaborator** scope. Unlike single-document
  GET, it does **not** grant access purely through the ancestor chain.

---

## Files & Upload

### POST /api/upload

Upload an image and get back a URL to reference it.

- **Auth:** required (`getSession()`).
- **Request:** `multipart/form-data` with a `file` field.
- **Validation:**
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`. Anything else
    (including SVG, which can carry scripts) → `400`.
  - Max size **5 MB** → `400` otherwise.
  - The stored file extension is derived from the **validated MIME type**, not the client-supplied
    filename, eliminating path-traversal and spoofed-extension risk.
- **Behavior:** stores the file at `<UPLOAD_DIR>/<userId>/<uuid>.<ext>` (`UPLOAD_DIR` defaults to
  `<cwd>/data/uploads`), creating the per-user directory as needed.
- **Responses:**
  - `200` - `{ "url": "/api/files/<userId>/<fileName>" }`.
  - `400` - no file (`"Dosya bulunamadı."`), unsupported type, or too large.
  - `401` / `500`.

---

### GET /api/files/{...path}

Serve a previously uploaded (private) file.

- **Auth:** required, **self-enforced.** This route is **excluded from the middleware matcher**,
  so it reads the `kotion-token` cookie and verifies the JWT itself. Missing/invalid token →
  `401` (`"Yetkisiz erişim."`).
- **Path:** catch-all segments resolved under `UPLOAD_DIR` (e.g. `/api/files/<userId>/<file>`).
- **Behavior & security:**
  - **Path-traversal guard:** the resolved path must equal `UPLOAD_DIR` or start with
    `UPLOAD_DIR + separator`; otherwise `403` (`"Erişim reddedildi."`). The separator check
    prevents sibling directories sharing the prefix (e.g. `uploads-evil`) from passing.
  - Non-file targets or read errors → `404`.
  - **Note:** any authenticated user who knows a valid path may fetch the file; access is gated on
    a valid session, not on ownership of the specific file.
- **Response (`200`):** raw image bytes with headers:
  - `Content-Type` inferred from extension (`jpg/jpeg`, `png`, `gif`, `webp`, `svg`; otherwise
    `application/octet-stream`).
  - `Cache-Control: private, max-age=31536000, immutable`
  - `X-Content-Type-Options: nosniff`
  - For SVG, `Content-Disposition: attachment` (served as a download so it cannot execute in the
    app origin).
- `401` / `403` / `404`.

---

## Access-Scope Rules

Access decisions come from `src/lib/document-access.ts`:

- **`getDocumentWithAccess(documentId, userId)`** resolves the caller's effective role for a
  single document, checking in order:
  1. **Owner** (`document.userId === userId`) → `OWNER`.
  2. **Direct collaborator** on that document → their stored role (`EDITOR` / `VIEWER`).
  3. **Ancestor-chain access** - walks up the `parentId` chain (bounded to 20 levels); if the
     caller owns or collaborates on any ancestor, that role is inherited by the child.
  - Used by: document GET / PATCH / DELETE, collaborators GET, and the `parentId` check in
    document POST.

- **`getAncestors(parentId, userId)`** **[v1.5]** builds the breadcrumb chain (root first). It
  is **access-filtered**: it stops at the first ancestor the caller cannot access, so a
  breadcrumb never leaks the title/icon of a hidden parent.

- **`getSharedDocuments(userId)`** returns non-archived documents where the user is a direct
  collaborator, annotated with `role` and `ownerName`.

- **Owner-only, no inheritance:** removing a collaborator (`DELETE .../collaborators`), creating
  an invitation (`POST /api/invitations`), and viewing collaborators require **strict ownership**
  of the specific document; ancestor-chain access does not qualify.

- **Owner + direct collaborator, no ancestor inheritance:** `GET /api/documents?shared=true`,
  `GET /api/documents?recent=true` **[v1.5]**, and `GET /api/search` **[v1.5]** scope results to
  documents the user owns or directly collaborates on.

---

## Data Model Reference

Prisma models backing the API (PostgreSQL). See `prisma/schema.prisma`.

- **User:** `id`, `name`, `email` (unique), `password` (bcrypt hash), `image?`, timestamps.
- **Document:** `id`, `title` (default `"Adsız"`), `content` (JSON), `contentText?`, `icon?`,
  `coverImage?`, `isArchived`, `isFavorite`, `isPublished`, `position`, `parentId?` (self
  relation, `onDelete: SetNull`), `userId` (`onDelete: Cascade`), timestamps.
- **Invitation:** `id`, `email`, `role` (`CollaboratorRole`, default `EDITOR`), `status`
  (`InvitationStatus`, default `PENDING`), `documentId`, `inviterId`, `inviteeId?`, timestamps.
  Unique on `(documentId, email)`.
- **Collaborator:** `id`, `role` (`CollaboratorRole`, default `EDITOR`), `documentId`, `userId`,
  `createdAt`. Unique on `(documentId, userId)`.
- **Enums:** `CollaboratorRole` = `VIEWER` | `EDITOR`; `InvitationStatus` = `PENDING` |
  `ACCEPTED` | `DECLINED`. `OWNER` is derived at runtime, not stored.
