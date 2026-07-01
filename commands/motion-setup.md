---
description: Prepare the current project for Motion-Primitives — ensure shadcn init, the @motion-primitives registry, and the motion/lucide-react/cn prerequisites.
argument-hint: "[optional: component to install after setup, e.g. text-effect]"
allowed-tools: Read, Edit, Write, Bash(npx:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Bash(bun:*), Bash(ls:*), Bash(test:*)
---

You are wiring the **current target project** so Motion-Primitives components
install cleanly through the shadcn registry. The shadcn MCP server (shipped by
this plugin's `.mcp.json`) reads the registry list from **this project's**
`components.json` — so the `@motion-primitives` entry must live here, in the
target repo, not in the plugin. Do the following, reporting each result.

## 1. Confirm this is a shadcn project

- Check for `components.json` at the project root (`ls components.json`).
- If it is **missing**, tell the user this project isn't shadcn-initialized and
  offer to run `npx shadcn@latest init` (do not run it unprompted — it writes
  config and may pick a style/base-color). Stop here until they confirm.

## 2. Ensure the `@motion-primitives` registry entry

Open `components.json`. Ensure it contains a `registries` map with this exact
entry (the URL is confirmed from Motion-Primitives' own `installation-cli`
source — do **not** alter it):

```json
{
  "registries": {
    "@motion-primitives": "https://motion-primitives.com/c/{name}.json"
  }
}
```

- If `registries` is absent, add it with this entry.
- If `registries` exists but lacks `@motion-primitives`, add the key — do not
  disturb other registries.
- If `@motion-primitives` already points at this URL, leave it and say so.
- `{name}` is a literal placeholder shadcn substitutes at install time
  (`add @motion-primitives/text-effect` → `.../c/text-effect.json`). Keep the
  braces.

## 3. Ensure runtime prerequisites

- **Detect the package manager first** from the lockfile so you never mix
  managers: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` or
  `bun.lock` → bun (Bun ≥1.2 writes the text `bun.lock`), else
  `package-lock.json`/none → npm. Use that manager's add syntax for every offer
  below (`pnpm add …`, `yarn add …`, `bun add …`, or `npm install …`).
- `motion` and `lucide-react` are installed (check `package.json`
  dependencies). If missing, offer to install them with the detected manager.
- A `cn` helper exists at the path this project's `components.json`
  `aliases.utils` resolves to (default `lib/utils.ts`). If absent, create it —
  **match the project's language**: for a TypeScript project write `.ts`; for a
  JS-only project (`components.json` has `"tsx": false`) write `lib/utils.js`
  with the type annotations dropped:

  ```ts
  // TypeScript (lib/utils.ts)
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```
  ```js
  // JavaScript (lib/utils.js) — when components.json "tsx": false
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  export function cn(...inputs) {
    return twMerge(clsx(inputs))
  }
  ```
  (needs `clsx` and `tailwind-merge` — offer to install with the detected
  manager if missing.)

## 4. Verify the install path

Confirm the chain works by describing (do not force-run) the two equivalent
install routes so the user can pick:

- **Via shadcn (MCP-aware):** `npx shadcn@latest add @motion-primitives/<name>`
- **Fallback, no registry needed:** `npx motion-primitives@latest add <name>`

If `$1` (or `$ARGUMENTS`) names a component, offer to install it now via the
shadcn route and confirm the file lands under the project's components
directory.

## 5. Report

Summarize: whether `components.json` existed, what you changed in `registries`,
prerequisite status, and the exact next command to install a component. Remind
the user that the actual motion work is directed by the
`motion-director:motion-primitives-director` skill — its budget, single
signature, and reduced-motion rules still apply.
