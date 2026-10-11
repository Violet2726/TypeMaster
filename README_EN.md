# TypeMaster Studio

TypeMaster Studio is a calm, text-first space for typing practice. Choose an original English passage and work at your own pace. Speed, accuracy, and keys worth revisiting stay on this device.

The interface defaults to Simplified Chinese and supports English, system light and dark appearance, larger text, increased contrast, and reduced motion. Mac, iPad, and iPhone use the same practice flow with their native keyboards.

## Develop

Requires Node.js 20.9+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

```bash
pnpm check       # formatting, lint, types, tests, design tokens, static build
pnpm test:e2e    # desktop, tablet, phone, and visual flows
```

## Workspace

- `apps/web`: Next.js App Router frontend and static export.
- `packages/domain`: deterministic practice rules and original passages, without React, browser, or network dependencies.
- `packages/config`: shared Vitest configuration.

Production output is `apps/web/out`. The practice experience makes no API requests and needs no account, database, or runtime service.

## Local records

Preferences and the latest 20 sessions stay in the browser's `typemaster-studio:v1:*` namespace. They are not uploaded or synced across devices.
