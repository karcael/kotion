# Kotion

A self-hosted Notion alternative built with Next.js. Write, organize, and share your notes without relying on third-party services. Runs entirely in Docker on your own server.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Version](https://img.shields.io/badge/Version-1.3.1-green)

## Features

### Block Editor
- Slash commands (`/`) with 15+ block types and keyboard navigation
- Rich text: bold, italic, underline, strikethrough, code, highlight, links
- Headings, bullet lists, numbered lists, task lists (with nesting via Tab/Shift+Tab)
- Code blocks with syntax highlighting
- Tables with floating toolbar (add/remove rows & columns)
- Multi-column layouts (2, 3, 4 columns — responsive on mobile/tablet)
- Image upload (drag & drop or URL) for inline images, covers, and page icons
- Page link blocks — embed navigable links to any page (including sub-pages)
- Drag & drop block reordering with grab handles
- Block context menu — click the handle to delete, duplicate, move, or convert block type
- Floating formatting toolbar on text selection
- Auto-save with debounce
- Dynamic browser tab title (shows current page name)

### Icons
- 1700+ Lucide icons with 9 color options (gray, brown, orange, yellow, green, blue, purple, pink, red)
- 500+ emojis across 10 categories
- Custom image upload as page icon
- Unified icon rendering across sidebar, search, invitations, and page links

### Organization
- Nested page hierarchy with sidebar tree navigation
- Drag & drop page reordering in sidebar
- Page icons (emoji, colored Lucide icon, or custom image)
- Cover images
- Favorites
- Trash & restore (soft delete)
- Search (`Ctrl+K` / `Cmd+K`)

### Sharing & Collaboration
- Share pages via email with Editor or Viewer roles
- Custom role selector with descriptions
- Invitation system with in-app accept/decline notifications
- Cancel pending invitations
- In-app confirmation dialogs (no browser alerts)
- Access control: Owner, Editor, Viewer permissions (inherited through parent pages)
- Live content sync between collaborators (polling-based, no page refresh needed)
- Shared pages section in sidebar

### Design
- Dark & light mode (system-aware with manual toggle)
- Responsive design (desktop, tablet, mobile)
- Notion-inspired minimal UI with smooth animations
- Custom Kotion logo and SVG favicon (auto adapts to dark/light mode)

### Security
- JWT authentication with HTTP-only cookies
- bcrypt password hashing
- File type and size validation on uploads
- Path traversal protection on file serving
- Role-based access control (owner-only delete, archive, publish)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Editor | Tiptap 3.20 |
| Database | PostgreSQL 17 + Prisma 7 |
| Styling | Tailwind CSS 4 |
| Auth | JWT (jose + bcryptjs) |
| State | Zustand |
| Icons | Lucide React (1700+ icons) |
| Deployment | Docker Compose |

## Quick Start with Docker

```bash
git clone https://github.com/Karcael/kotion.git
cd kotion

cp .env.example .env
# Edit .env — change JWT_SECRET and NEXT_PUBLIC_APP_URL

docker-compose up -d --build
```

The app will be available at `http://localhost:3000`. Connect Cloudflare Tunnel, Nginx, or Traefik to expose via HTTPS with a custom domain.

## Local Development

**Prerequisites:** Node.js 22+, PostgreSQL 17+

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL

npx prisma db push
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://kotion:kotion@localhost:5432/kotion` |
| `JWT_SECRET` | Secret key for JWT signing | **Must change in production** |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `http://localhost:3000` |
| `APP_PORT` | External Docker port | `3000` |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              Login & register
│   ├── (main)/documents/    Main app with editor
│   └── api/
│       ├── auth/            Authentication + collab token
│       ├── documents/       CRUD + collaborators + reorder
│       ├── invitations/     Sharing system
│       ├── search/          Full-text search
│       ├── upload/          File uploads
│       └── files/           File serving
├── components/
│   ├── editor/              Tiptap editor + toolbars
│   │   └── extensions/      Custom: columns, page-link
│   ├── sidebar/             Navigation tree + sharing UI
│   └── ...                  UI components (icon picker, share dialog, etc.)
├── hooks/                   Custom React hooks
├── lib/                     Auth, Prisma, access control
└── stores/                  Zustand state
```

## Docker Architecture

```
docker-compose up -d --build

  ┌─────────────────────────────────────┐
  │  postgres (PostgreSQL 17)           │
  │  Volume: postgres-data (persistent) │
  └──────────────┬──────────────────────┘
                 │
  ┌──────────────┴──────────────────────┐
  │  app (Next.js standalone)           │
  │  Port: ${APP_PORT:-3000}            │
  │  Volume: uploads (persistent)       │
  │                                     │
  │  Startup:                           │
  │  1. prisma db push (auto-migrate)   │
  │  2. node server.js                  │
  └─────────────────────────────────────┘
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
