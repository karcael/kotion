# Kotion Architecture

Kotion is a self-hosted Notion alternative: a block-based document editor with
nested pages, sharing/collaboration, full-text search, and export. It runs as a
single Next.js application backed by PostgreSQL, deployed with Docker Compose.

This document is the entry point for understanding the codebase. Companion docs:
`database.md` (full data model) and `api.md` (full endpoint reference). Version:
1.5.0.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | `output: "standalone"`, Turbopack in dev |
| UI runtime | React 19 | Client components for interactive UI |
| Language | TypeScript 5.9 | `@/*` path alias to `src/*` |
| Editor | Tiptap 3.20 (ProseMirror) | Shared extension factory (editor + export) |
| Syntax highlighting | lowlight 3 + `code-block-lowlight` | 24 languages, React NodeView |
| Database | PostgreSQL 17 | `jsonb` document content |
| ORM | Prisma 7 + `@prisma/adapter-pg` (driver adapter over `pg`) | |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) | Dark/light via `next-themes` |
| State | Zustand 5 | Small client stores, one persisted |
| Auth | JWT via `jose` (HS256) + `bcryptjs` | httpOnly cookie |
| Icons | `lucide-react` (1700+) | Plus emoji + custom image icons |
| Notifications | `sonner` | Toasts |
| Testing | Vitest 4 (node env) | Pure helper unit tests |
| Deployment | Docker Compose (app + postgres) | Node 22 Alpine runtime |

`next.config.ts` marks `@prisma/client`, `prisma`, `@prisma/adapter-pg`, and
`pg` as `serverExternalPackages` so they are not bundled and load as native
Node modules at runtime.

---

## 2. Directory Structure

```
src/
├── middleware.ts              Edge auth gate (JWT verify) for pages + /api
├── app/
│   ├── layout.tsx             Root layout: ThemeProvider, Toaster, favicon, metadata
│   ├── page.tsx               Root redirect (handled mostly by middleware)
│   ├── globals.css            Tailwind 4 layer + design tokens
│   ├── (auth)/                Public auth route group
│   │   ├── layout.tsx         Minimal centered layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                Authenticated app route group
│   │   ├── layout.tsx         Server layout: getSession() or redirect(/login)
│   │   └── documents/
│   │       ├── page.tsx       Welcome screen: recents + template grid + blank page
│   │       └── [documentId]/page.tsx   Document view: autosave, breadcrumb, editor
│   └── api/                   Route handlers (see api.md)
│       ├── auth/              login · register · logout · me
│       ├── documents/         list/create · [id] CRUD · [id]/collaborators · reorder
│       ├── invitations/       send/list · [id] accept/decline/cancel
│       ├── search/            full-text search over title + contentText
│       ├── upload/            image upload (MIME whitelist, 5MB)
│       └── files/[...path]/   session-gated file serving (path-traversal safe)
├── components/
│   ├── main-layout.tsx        Client shell: sidebar + main + 5-min session poll
│   ├── editor/
│   │   ├── editor.tsx         Tiptap instance, polling live-sync, menus wiring
│   │   ├── extensions/
│   │   │   ├── index.ts       getEditorExtensions() - shared extension factory
│   │   │   ├── columns.ts     Columns / Column custom nodes (2-4 col layout)
│   │   │   ├── page-link.tsx  PageLink atom node (live title/icon via store)
│   │   │   ├── table-cell-extended.ts    + textAlign / verticalAlign attrs
│   │   │   ├── table-header-extended.ts  + alignment attrs
│   │   │   └── table-row-extended.ts     + row height attr
│   │   ├── code-block-component.tsx   React NodeView: language select + copy
│   │   ├── slash-command.tsx          "/" menu (block insertion, image/page-link hooks)
│   │   ├── bubble-menu-bar.tsx        Floating text-format toolbar
│   │   ├── table-menu.tsx / table-row-resize.tsx   Table toolbar + row resize
│   │   ├── columns-menu.tsx / column-resize.tsx    Columns toolbar + width resize
│   │   └── drag-handle-react.tsx      Block drag/reorder + block context menu
│   ├── sidebar/
│   │   ├── sidebar.tsx        Tree container, resize, search/trash triggers
│   │   ├── document-list.tsx  Recursive page tree + drag reorder
│   │   ├── item.tsx           Single tree row
│   │   ├── shared-list.tsx    "Shared with me" section
│   │   ├── invitation-list.tsx  In-app invitation accept/decline
│   │   ├── trash-box.tsx      Archived pages: restore / delete
│   │   └── user-item.tsx      Account menu + logout
│   ├── breadcrumb.tsx         Ancestor trail above a page
│   ├── toolbar.tsx            Page title, icon/cover controls, export, share
│   ├── share-dialog.tsx       Invite by email, role picker, collaborator mgmt
│   ├── search-command.tsx     Ctrl/Cmd+K search modal with snippets
│   ├── session-expired-dialog.tsx   Blocking modal on 401
│   ├── icon-picker.tsx / page-icon.tsx   Emoji/Lucide/image icon UI + rendering
│   ├── image-upload-dialog.tsx / page-link-dialog.tsx   Insert dialogs
│   ├── cover.tsx / banner.tsx / title.tsx / confirm-modal.tsx / spinner.tsx / logo.tsx
│   └── providers/theme-provider.tsx   next-themes wrapper
├── lib/
│   ├── prisma.ts              Prisma client singleton (pg driver adapter)
│   ├── jwt-secret.ts          Fail-fast JWT_SECRET loader (no insecure fallback)
│   ├── auth.ts                Token sign/verify, getSession(), cookie options
│   ├── document-access.ts     Access control + ancestor/breadcrumb/shared queries
│   ├── tiptap-text.ts         extractPlainText() for search denormalization
│   ├── search-snippet.ts      buildSnippet() match window with ellipses
│   ├── export.ts              documentToHTML / HTML + PDF export, slugify
│   ├── templates.ts           20 page templates (Tiptap JSON) across 5 categories
│   ├── format-relative-time.ts   Turkish relative timestamps
│   └── utils.ts               cn() classnames + stableStringify() canonical JSON
├── stores/
│   ├── use-sidebar.ts         Sidebar open/width/refreshKey/titleOverrides (persisted width)
│   ├── use-session.ts         sessionExpired flag (drives blocking dialog)
│   ├── use-search.ts          Search modal open state
│   └── use-document-meta.ts   Live per-document title/icon fetch + cache
├── hooks/
│   ├── use-debounce.ts        Generic debounced value
│   └── use-media-query.ts     Responsive breakpoint hook
scripts/
└── backfill-content-text.ts   One-off: populate contentText for legacy rows
prisma/
└── schema.prisma              Data model (see database.md)
```

---

## 3. Key Architectural Decisions & Patterns

### 3.1 Authentication (JWT in an httpOnly cookie)

- On login/register the server signs an HS256 JWT (`{ userId, email }`, 7-day
  expiry) with `jose` and sets it as the `kotion-token` cookie: `httpOnly`,
  `sameSite=lax`, `secure` in production, `path=/`, `maxAge` 7 days
  (`src/lib/auth.ts`). Logout clears it with `maxAge: 0`.
- The signing secret is loaded once through `src/lib/jwt-secret.ts`, which
  **throws at startup if `JWT_SECRET` is unset** - the app never falls back to a
  hardcoded secret. Docker Compose also refuses to start without it.
- Passwords are hashed with bcrypt (12 rounds). Login runs `bcrypt.compare`
  against a constant dummy hash when the user is missing, so response timing does
  not reveal whether an email is registered (user-enumeration defense).
- `src/middleware.ts` is the edge gate. It distinguishes page vs. API routes:
  for an unauthenticated/expired **API** request it returns **401 JSON**; for a
  **page** request it **redirects to `/login`**. This split matters - if API
  routes redirected instead, client `fetch` would follow the redirect, receive
  HTML, and the client-side 401 session handling would never fire. The matcher
  excludes `_next/static`, `_next/image`, `favicon.ico`, and `api/files`
  (the file route does its own cookie verification).
- `getSession()` (`src/lib/auth.ts`) is the server-side accessor used by every
  API route and the `(main)` layout: it reads the cookie, verifies the token, and
  loads the user record.

### 3.2 Access Control Model

`src/lib/document-access.ts` centralizes authorization. `getDocumentWithAccess`
resolves a user's role for a document by checking three sources in order:

1. **Owner** - `document.userId === userId` → `OWNER`.
2. **Direct collaborator** - a `Collaborator` row for `(documentId, userId)`
   → its role (`EDITOR` / `VIEWER`).
3. **Inherited through parent** - `checkAncestorAccess` walks up the `parentId`
   chain (bounded to depth 20); the first ancestor the user owns or collaborates
   on grants that role to the descendant. This is what makes sharing a parent
   page transparently share its whole subtree.

Role semantics enforced in the API:
- `VIEWER` cannot edit (PATCH content/title returns 403).
- `isArchived` / `isFavorite` / `isPublished` are **owner-only**.
- Delete is **owner-only** and cascades to the whole subtree.
- Collaborator/invitation lists are owner-only (they expose emails).

`getAncestors` (used by the breadcrumb) is **access-filtered**: it stops at the
first ancestor the user cannot access, so the breadcrumb never leaks hidden
parent titles/icons. `getSharedDocuments` powers the sidebar "Shared with me"
section.

Note: the Prisma `CollaboratorRole` enum only has `VIEWER` / `EDITOR`; `OWNER`
is a computed role in the `DocumentRole` TypeScript type, never stored.

### 3.3 Editor (Tiptap) and the Shared Extension Factory

- The editor is built in `src/components/editor/editor.tsx` with `useEditor`.
  `immediatelyRender: false` avoids SSR hydration mismatches.
- **`getEditorExtensions()`** (`extensions/index.ts`) is the single source of
  truth for the document schema. It is used by **both** the live editor **and**
  the export path (`generateHTML` in `lib/export.ts`). This guarantees exported
  HTML matches the editor's node/mark schema exactly - a custom node added once
  is understood by both renderers.
- Extension composition: `StarterKit` (with its own `codeBlock`, `link`, and
  `underline` disabled to avoid duplicate registration), plus Placeholder,
  Task list/item, Image, Highlight, Underline, Link (`openOnClick:false` - see
  below), TextStyle+Color, and the custom set.
- **Custom nodes:**
  - `CodeBlockLowlight` extended with `ReactNodeViewRenderer(CodeBlockComponent)`
    - a React NodeView giving a language selector and copy button.
  - `Columns` / `Column` (`columns.ts`) - a grid container holding 2-4 columns
    (`content: "column{2,4}"`), with a `widths` attribute for resizable columns.
  - `PageLink` (`page-link.tsx`) - an atom block embedding a navigable link to
    another page. Its React NodeView calls `useDocumentMeta(pageId)` so the
    displayed title/icon stay **live** (reflect the target page's current name),
    falling back to a stored snapshot. It also implements `renderHTML` so it
    survives static export.
  - `TableCellExtended` / `TableHeaderExtended` / `TableRowExtended` - add
    `textAlign` / `verticalAlign` (and row height) attributes on top of the base
    Tiptap table nodes.
  - `SlashCommand` - the `/` menu; image and page-link items call back into the
    editor via `onImageRequest` / `onPageLinkRequest` to open insert dialogs.
- **Link click handling:** all Tiptap `Link` marks have `openOnClick:false`; a
  single delegated click handler in `editor.tsx` routes page-links via
  `router.push` (SPA nav), honors modifier/middle-click for new tabs, and opens
  external `http(s)` links in a new tab. This prevents the double-navigation that
  would occur if both Tiptap and the handler acted on a click.
- A small root-layout inline script suppresses the dev error overlay for rare
  ProseMirror `Position` RangeErrors during concurrent edits (they are handled
  locally in the editor).

### 3.4 Live Sync via Polling (no Y.js / CRDT)

Real-time collaboration is intentionally implemented with **polling**, not a
CRDT, to keep the stack simple and stateless. The editor polls
`GET /api/documents/[id]` every **3 seconds** and reconciles using a
**two-hash model** (`editor.tsx`):

- `lastLocalEditRef` - timestamp of the last local keystroke.
- `lastLocalHashRef` - canonical hash of the content the editor currently shows.
- `lastRemoteHashRef` - canonical hash of the content last agreed with the server.

Two separate hashes prevent a poll from overwriting local edits with stale
server content while a save is in flight. Reconciliation logic per tick:

1. Skip entirely unless it is safe to apply remote content (`canApplyRemote`):
   at least 3s since the last local edit, not mid-IME-composition, and no insert
   dialog open (which holds a pending insertion range).
2. If the server hash equals `lastRemoteHashRef` → nothing changed, skip.
3. If the server hash equals `lastLocalHashRef` → our own save came back; just
   advance `lastRemoteHashRef`, do not touch the document.
4. Otherwise a collaborator wrote something different → apply it.

- **Canonical hashing:** `stableStringify` (`lib/utils.ts`) serializes JSON with
  recursively **sorted keys**. PostgreSQL `jsonb` does not preserve object key
  order, so a plain `JSON.stringify` comparison of local vs. round-tripped
  content would always differ; sorting keys makes the comparison stable.
- **Applying remote content:** `applyRemoteContent` replaces the doc via a
  ProseMirror transaction with `addToHistory:false` and `preventUpdate:true`
  (so it is neither undoable nor treated as a local edit that would trigger a
  save), and restores the cursor within safe bounds. On failure it leaves the
  editor untouched and returns `false`.
- A `401` during polling flips the `sessionExpired` store flag, surfacing the
  blocking session dialog.

### 3.5 Autosave, Manual Save, and Recovery

In `app/(main)/documents/[documentId]/page.tsx`:

- **Debounced autosave:** editor `onChange` stores the latest content in a ref
  and schedules a `PATCH` after **1000 ms**. After the debounce fires, the timer
  ref is cleared so later flushes don't re-send already-saved content (which
  would clobber a collaborator's edit).
- **Ctrl+S / Cmd+S:** cancels the debounce and saves immediately, with a
  "Kaydedildi" toast.
- **Flush on exit:** `beforeunload` sends a `keepalive` PATCH so edits survive a
  tab close/reload; the unmount/navigation cleanup sends a normal (non-keepalive)
  PATCH so switching documents in the SPA never drops the last edits.
- **Session recovery:** when the session expires with unsaved content, that
  content is written to `localStorage` under `kotion-recovery-<id>`. On the next
  open of that document, the page PATCHes the recovered content to the server
  **first**, and only removes the local copy once the save succeeds (retried
  otherwise), then shows a recovery toast.
- **Session guard:** `main-layout.tsx` polls `/api/auth/me` on mount, on tab
  re-focus (`visibilitychange`), and every 5 minutes; a 401 raises the blocking
  `SessionExpiredDialog`.

---

## 4. v1.5 Feature Slices

### Content Search
- Document content is **denormalized** to a plain-text `contentText` column.
  `extractPlainText` (`lib/tiptap-text.ts`) walks the Tiptap JSON, concatenating
  text nodes and separating block-level nodes with newlines. It is called on
  every create (`POST /api/documents`) and content update
  (`PATCH /api/documents/[id]`). `scripts/backfill-content-text.ts` backfills
  legacy rows (idempotent - only `contentText: null`).
- `GET /api/search?q=` queries the user's own + collaborated, non-archived
  documents with case-insensitive `contains` over `title` **and** `contentText`,
  then builds a highlighted-match snippet with `buildSnippet`
  (`lib/search-snippet.ts`) - a word-boundary-trimmed window around the first
  match with ellipses. Rows without a content snippet are flagged as title
  matches. The UI is the `Ctrl/Cmd+K` `SearchCommand` modal.

### Export (HTML / PDF)
- `documentToHTML` (`lib/export.ts`) renders the stored Tiptap JSON to HTML via
  Tiptap's `generateHTML` using the **same** `getEditorExtensions()`, so export
  fidelity matches the editor. It then **inlines app-hosted images as `data:`
  URIs** (`isAppInternal` compares the resolved URL origin - not a naive
  `startsWith` - and `toDataUri` fetches + base64-encodes) so the output file is
  fully self-contained.
- `buildDocumentHTML` wraps the body in a standalone HTML document with inlined
  `EXPORT_STYLES` (mirroring editor styles, including columns and page-links).
  All interpolated values (title, icon, cover) go through `escapeHtml` to prevent
  XSS in the exported file.
- `exportAsHTML` downloads a Blob; `exportAsPDF` writes the HTML into a hidden
  same-document iframe and calls `print()` (uses the browser print-to-PDF dialog,
  avoiding popup blockers). `slugify` produces the filename (with Turkish-char
  transliteration).

### Breadcrumb & Recent Documents
- The breadcrumb uses `getAncestors` (access-filtered, depth-bounded) returned
  alongside the document from `GET /api/documents/[id]`.
- The welcome screen fetches `GET /api/documents?recent=true` (own + shared,
  non-archived, `updatedAt desc`, top 6) for a "continue where you left off"
  grid, rendered with `formatRelativeTime`.

---

## 5. Data Model (summary - full detail in `database.md`)

PostgreSQL via Prisma. IDs are `cuid()`. Key models:

- **User** - `id`, `name`, `email` (unique), `password` (bcrypt), `image?`;
  owns documents, sends/receives invitations, has collaborations.
- **Document** - self-referential tree via `parentId` (`onDelete: SetNull`);
  belongs to a `User` (`onDelete: Cascade`). Fields: `title`, `content` (`Json?`,
  Tiptap doc), `contentText` (`String?`, search denormalization), `icon?`,
  `coverImage?`, `isArchived`, `isFavorite`, `isPublished`, `position` (sidebar
  order). Indexed on `userId`, `parentId`, and `(userId, isArchived)`.
- **Invitation** - email-based share invite: `role` (`VIEWER`/`EDITOR`),
  `status` (`PENDING`/`ACCEPTED`/`DECLINED`), `inviter`, optional `invitee`.
  Unique on `(documentId, email)`.
- **Collaborator** - accepted access grant: `role` (`VIEWER`/`EDITOR`), unique
  on `(documentId, userId)`. Created when an invitation is accepted.

Enums: `InvitationStatus`, `CollaboratorRole`.

---

## 6. API Summary (full detail in `api.md`)

All routes are Next.js App Router handlers under `src/app/api`. Every route
except `auth/*` requires a valid session (enforced by middleware **and**
re-checked via `getSession()` in the handler). Turkish user-facing error
messages, standard HTTP status codes.

| Area | Endpoints |
|------|-----------|
| Auth | `POST auth/login`, `POST auth/register`, `POST auth/logout`, `GET auth/me` |
| Documents | `GET/POST documents` (list variants: `parentId`, `favorites`, `archived`, `shared`, `all`, `recent`); `GET/PATCH/DELETE documents/[id]`; `PATCH documents/reorder` |
| Collaborators | `GET/DELETE documents/[id]/collaborators` (owner-only) |
| Invitations | `POST/GET invitations`; `PATCH invitations/[id]` (accept/decline), `DELETE invitations/[id]` (cancel) |
| Search | `GET search?q=` |
| Files | `POST upload` (MIME whitelist jpg/png/gif/webp, 5 MB, per-user dir); `GET files/[...path]` (session-gated, path-traversal-safe, SVG forced to download) |

Archive/restore and delete on `documents/[id]` operate on the **whole subtree**
(level-by-level descendant collection, wrapped in a transaction for archive; a
single `deleteMany` for delete). Restoring a page also un-archives its archived
ancestor chain.

---

## 7. Deployment

- **Docker Compose** (`docker-compose.yml`) runs two services:
  - `postgres` (postgres:17-alpine) with a persistent `postgres-data` volume and
    a `pg_isready` healthcheck.
  - `app` (built from `Dockerfile`) with a persistent `uploads` volume, depending
    on postgres being healthy, and a `/login` HTTP healthcheck.
- **`Dockerfile`** is a multi-stage Node 22 Alpine build (`deps` → `builder` →
  `runner`). It uses Next's **`standalone`** output (`server.js` + minimal
  `node_modules`) and explicitly copies the Prisma client and the `pg` driver
  adapter's transitive modules, since those are externalized from the bundle.
- **Startup command:** `prisma db push --schema ... && node server.js`. `db push`
  is run **without `--accept-data-loss`** on purpose - a destructive schema
  change aborts startup with an error instead of silently dropping production
  data.
- **Secrets:** `JWT_SECRET` is required; both `jwt-secret.ts` and Compose fail
  fast if it is missing. `DATABASE_URL` points at the `postgres` service inside
  the Compose network. `UPLOAD_DIR` defaults to `/app/data/uploads`.
- **HTTPS / public exposure:** the app listens on port 3000; TLS and a custom
  domain are provided externally via **Cloudflare Tunnel** (or Nginx/Traefik).
  Uploaded files are private and only served to authenticated sessions.

---

## 8. Testing

- **Vitest 4**, node environment, includes `src/**/*.test.ts`
  (`vitest.config.ts`). Run with `npm test` (`vitest run`) or `npm run test:watch`.
- Tests cover the **pure helper functions** - no database, network, or DOM:
  - `tiptap-text.test.ts` - `extractPlainText` (block separation, nesting,
    blank-line collapsing).
  - `search-snippet.test.ts` - `buildSnippet` (match window, ellipses,
    case-insensitivity, near-start handling).
  - `format-relative-time.test.ts` - `formatRelativeTime`.
  - `export.test.ts` - `slugify` and `buildDocumentHTML` (including that
    dangerous characters in title/icon/cover are HTML-escaped).
- Rationale: the deterministic, side-effect-free helpers carry the subtle logic
  (search indexing, snippet windows, export escaping), so they are the highest
  value to lock down with fast unit tests. Route handlers and React components
  are not unit-tested.

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | Production server |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:studio` | Prisma Studio |
| `npm run db:backfill-content-text` | Backfill `contentText` for legacy rows |
| `npm test` / `npm run test:watch` | Vitest |
