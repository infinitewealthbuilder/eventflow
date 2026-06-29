# Contributing to EventFlow

Thanks for your interest in contributing! This guide covers everything you need to get a local environment running and submit changes.

## Prerequisites

- **Node.js 20+** — the project targets the Node 20 LTS line.
- **pnpm** — the package manager used by this repo. Install it with `npm install -g pnpm` or via [Corepack](https://nodejs.org/api/corepack.html) (`corepack enable`).

## Install

Install dependencies from the repo root:

```bash
pnpm install
```

This also runs `prisma generate` automatically (via the `postinstall` script) so the Prisma client is ready to use.

## Local Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app. The page auto-updates as you edit source files.

Other useful scripts:

- `pnpm build` — generate the Prisma client and create a production build.
- `pnpm start` — run the production build locally.
- `pnpm lint` — run the linter.
- `pnpm db:generate` — regenerate the Prisma client.
- `pnpm db:push` — push the Prisma schema to your database.
- `pnpm db:migrate` — create and apply a development migration.
- `pnpm db:studio` — open Prisma Studio to inspect your data.

## Opening a Pull Request

1. **Fork or branch** — create a feature branch off the default branch (e.g. `git checkout -b fix/short-description`).
2. **Make your changes** and keep commits focused and descriptive.
3. **Verify locally** — run `pnpm lint` and `pnpm build` to make sure everything passes before pushing.
4. **Push** your branch: `git push origin <your-branch>`.
5. **Open a PR** against the default branch on GitHub. Include a clear title and a description of what changed and why. Link any related issues (e.g. `Closes #18`).
6. **Address review feedback** by pushing additional commits to the same branch.

We appreciate your contributions!
