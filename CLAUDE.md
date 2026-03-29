# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # First-time setup: install deps, generate Prisma client, run migrations
npm run dev         # Start dev server (Turbopack)
npm run build       # Production build
npm run lint        # Run ESLint
npm run test        # Run all tests (Vitest)
npm run db:reset    # Force reset the SQLite database
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Environment

Copy `.env` and add your Anthropic API key. Without it, the app falls back to a `MockLanguageModel` that generates static example components.

```
ANTHROPIC_API_KEY=your_key_here
```

## Architecture

UIGen is a Next.js 15 app where users describe React components in a chat interface, Claude generates code via tool calls into a **virtual file system** (no disk writes), and the result is shown in a live preview iframe.

### Request Flow

1. User sends a message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. Route calls `streamText()` (Vercel AI SDK) with the Claude model and two tools: `str_replace_editor` and `file_manager`
3. Tool calls stream back to the client and are handled by `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`), which updates the in-memory `VirtualFileSystem`
4. The preview iframe renders `App.jsx` (the required root entry point) from the virtual FS via `@babel/standalone` JSX transform

### Key Modules

- **`src/lib/file-system.ts`** — `VirtualFileSystem` class: pure in-memory file system used for all generated code. Serializes to/from JSON for DB persistence.
- **`src/lib/provider.ts`** — Selects the LLM provider. Uses `claude-haiku-4-5` when an API key is present; falls back to `MockLanguageModel` otherwise. Mock returns a deterministic 4-step tool call sequence with simulated streaming.
- **`src/lib/prompts/generation.tsx`** — System prompt sent to Claude. Defines the rules: `/App.jsx` as root, Tailwind for styling, `@/` import aliases for internal references.
- **`src/lib/tools/`** — Tool factories `buildStrReplaceTool()` and `buildFileManagerTool()` wrap `VirtualFileSystem` operations. `str_replace_editor` handles view/create/str_replace/insert; `file_manager` handles rename/delete.
- **`src/lib/transform/`** — JSX-to-JS transform pipeline for the browser preview. Fetches third-party packages from `esm.sh` at runtime, builds an import map with `@/` alias resolution, strips CSS imports (storing them separately), and generates error boundary HTML for syntax errors.

### State Management

Two React contexts handle all client state:

- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — holds the `VirtualFileSystem` instance, selected file, and processes incoming tool call results from the AI stream.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat` hook, manages messages and form submission, coordinates with `FileSystemContext`.

### Auth & Persistence

- JWT sessions via `jose` stored in HTTP-only cookies (`src/lib/auth.ts`)
- `src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes
- On chat completion, the project (messages + serialized file system as JSON) is saved to SQLite via Prisma's `onFinish` callback in the chat route
- Anonymous users can use the app; their work is only persisted if they sign up. `src/lib/anon-work-tracker.ts` uses `sessionStorage` to detect whether anonymous users have created content (to prompt sign-up).

### SSR Compatibility

`node-compat.cjs` removes `localStorage`/`sessionStorage` globals on the server to prevent SSR guard check failures under Node 25+. It is injected via `NODE_OPTIONS=--require` in all dev/build/start scripts.

### Database

Prisma with SQLite (`prisma/dev.db`). Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings. Generated client lives in `src/generated/prisma/`.

### UI Layout

`src/app/main-content.tsx` renders a resizable three-panel layout using `react-resizable-panels`: Chat panel on the left, and Preview/Code editor tabs on the right. The code editor uses Monaco (`@monaco-editor/react`).
