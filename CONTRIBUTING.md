# Contributing

Issues and pull requests are welcome. Describe the behavior you expect, the behavior you observe, and steps to reproduce it. Include your provider/model and browser when relevant, but remove API keys and private sketch content.

## Setup

Follow the pnpm setup in [README.md](README.md). Use Node.js 22.13.0 or newer and pnpm 11.25.0. Keep `.env.local` private; the regression tests use mocked provider responses and require no real keys.

## Before submitting a pull request

```sh
pnpm install --frozen-lockfile
pnpm test:patch
pnpm build
pnpm typecheck
git diff --check
```

Add focused regression coverage for changes to scheduling, request handling, or patch safety. Manually check visible UI changes in `pnpm dev`, including a narrow viewport. Explain what changed and how you verified it in your pull request.

Preserve these behaviors: active requests finish before queued edits start; invalid patches retain existing HTML; provider/model selection does not regenerate; design-system changes rebuild the page; explicit Clear cancels work. Keep the pnpm lockfile in sync with dependency changes.

Generated HTML and Lit source are prototypes. Avoid claiming exact design-system conformance, deployment readiness, or integrations the app does not implement.
