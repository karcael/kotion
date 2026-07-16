# Kotion - Project Memory

Running record of important decisions and changes. Check this file before starting work; update it after significant changes. For structure see `architecture.md`, for endpoints `api.md`, for schema `database.md`.

## Current state

- **Version 1.5.0**, on `main` (pushed to github.com/karcael/kotion).
- Self-hosted Notion alternative: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9, Tiptap 3.20, Prisma 7 + PostgreSQL 17, Tailwind 4, Zustand, JWT (jose + bcryptjs), Docker Compose + Cloudflare Tunnel.

## History & key decisions

### v1.4.1 audit + fixes (2026-07-15)
A full audit found and fixed real bugs across the codebase. Key fixes now in `main`:
- **Auth:** removed the hardcoded JWT fallback secret (`src/lib/jwt-secret.ts` fails fast if `JWT_SECRET` is unset). Middleware now returns **401 JSON for `/api/*`** when unauthenticated instead of redirecting to `/login` - this is what makes the client-side session-expired detection actually fire.
- **Editor live-sync data loss (the big one):** root cause was `Document.content` being `jsonb`, which does not preserve object key order, so the old `JSON.stringify` hash comparison always differed and triggered a spurious `setContent` after every edit. Fixed with a canonical serializer (`stableStringify` in `utils.ts`) and a **two-hash model** (`lastLocalHashRef` / `lastRemoteHashRef`) that prevents a failed/in-flight save from being overwritten by an older server copy. Polling now also waits during IME composition, open dialogs, and in-flight saves; remote updates use `addToHistory:false`; recovery content is only dropped after a confirmed save; pending content is flushed on unmount/`beforeunload`. NOTE: simultaneous two-user editing is still last-write-wins (true fix needs CRDT/Y.js).
- **File security:** `/api/files` now requires a session, rejects SVG uploads (was stored-XSS), derives extension from validated MIME (not `file.name`), adds `nosniff`.
- **API:** email normalization (register/login/invitations), `parentId` access check on create, recursive archive/restore/delete rewritten as `$transaction` + `updateMany`/`deleteMany`, login timing equalized with a constant dummy hash, collaborators list is owner-only.
- **UI:** search-command crash guard, many `res.ok` + `toast.error` additions, `window.confirm` -> shared `ConfirmModal`, `resolvedTheme` for the theme toggle, drag-drop off-by-one fix, and Turkish-string / aria-label / cursor-pointer polish.
- **Infra/cleanup:** Docker `db push` no longer uses `--accept-data-loss`; `prisma.config.ts` moved to project root (Prisma 7 requirement) + dotenv; removed 11 unused packages (Hocuspocus/Y.js stack + react-dropzone), which let `--legacy-peer-deps` be dropped; deleted the dead `collab-token` route.

### v1.5 features (2026-07-16)
Built via subagent-driven development (16 tasks, per-task review, opus final review). All on `main`.
1. **Content search** - `Document.contentText` denormalized plain text (synced on POST/PATCH via `extractPlainText`); search matches title OR content, scoped to owner + direct collaborator, returns highlighted snippets (`buildSnippet`). Backfill: `npm run db:backfill-content-text`.
2. **Export** - `src/lib/export.ts`: HTML (self-contained, images inlined as data URIs, user fields escaped for XSS, columns/page-link styles mirrored from the editor) and PDF (browser print). Toolbar "Dışa Aktar" menu (all roles).
3. **Breadcrumb** - `getAncestors(parentId, userId)` returns only accessible ancestors (stops at first inaccessible - no metadata leak). `src/components/breadcrumb.tsx`.
4. **Recent documents** - `/api/documents?recent=true`, welcome-screen "Kaldığın yerden devam et" with relative time.
- New infra: **Vitest** (dev-only) - 18 tests for pure helpers; shared `getEditorExtensions()` factory (editor + export use the same schema).

## Conventions
- User-facing strings Turkish (sentence-final period, no em/en dash). Code and comments English. Clickables get `cursor-pointer`; icon-only buttons get `aria-label`; in-app modals, never `window.confirm/alert`.
- Git commits carry no AI signature / Co-Authored-By.

## Gotchas
- Prisma 7 `db push` does NOT auto-generate the client - run `prisma generate` and restart the dev server after a schema change.
- `generateHTML` is imported from `@tiptap/core` (transitive dep; add to package.json deps if using pnpm).
- keepalive fetch has a ~64KB body limit (used only for `beforeunload` flush).
- Editor extension schema must stay identical between `getEditorExtensions()` consumers (editor + export) or exports diverge from on-screen rendering.
- Search/recent access scope = owner + direct collaborator (inherited-through-parent is intentionally excluded).

## Known limitations / possible follow-ups
- No true real-time collaboration (polling last-write-wins).
- `getAncestors` runs on the editor's 3s poll GET (the poll doesn't use `ancestors`; could add `?ancestors=true`).
- No Prisma migration history yet (`db push`); moving to `prisma migrate` is the recommended next step (`.gitignore` no longer ignores `prisma/migrations/`).
- No rate limiting; JWT has no server-side revocation (no `tokenVersion`).
- Export failures now show a toast; PDF fidelity depends on the browser print dialog.
