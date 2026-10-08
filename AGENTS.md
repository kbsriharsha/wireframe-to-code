# Working on Wireframe Studio

## Setup and architecture

- Use pnpm 11.25.0 and the committed `pnpm-lock.yaml`. Install with `pnpm install --frozen-lockfile`; update the lockfile when changing dependencies. Node.js 22.13.0 or newer is required.
- `app/page.tsx` owns the studio controls, Excalidraw integration, speech recognition, generation scheduling, preview, and export.
- `app/api/generate/route.ts` validates requests and streams Gemini/OpenAI responses. `lib/llm.ts` defines provider/model options; `lib/design-systems.ts` supplies visual guidance.
- `lib/canvas-changes.ts` captures visual scene snapshots and computes element deltas. `lib/html-patch.ts` validates and applies exact replacements; `lib/generation-stream.ts` reads completed streams. `lib/speech-presentation.ts` tracks the latest utterance and request-related feedback.
- `components/resizable-workspace.tsx` controls panel resizing. Studio styles live in `app/globals.css`; they are separate from generated prototype styles.

## Preserve generation behavior

- Let active generation finish before starting queued work. Combine pending edits and restart the pause after completion; defer automatic work during drawing gestures or partial speech. Explicit Clear and unmount cancel immediately.
- Manual Generate and design-system changes rebuild the complete HTML. Design-system selection queues a rebuild even with Auto off. Provider/model selection preserves output and applies to the next request without triggering generation.
- After the first successful generation, automatic canvas and instruction edits use patches. Instruction-only patches omit the drawing image; canvas patches include an updated image and changes from the last successful scene.
- Failed or ambiguous patches preserve both existing HTML and the successful scene baseline. Advance baselines only after validated success. Preserve bounded, unambiguous replacements and completed-stream checks.
- Keep the microphone and full editable speech history below the canvas; show the latest utterance above the preview. An older request must not mark newer speech Updated.
- Panel resizing and preview-width changes must not trigger generation.

## Sketch and design guidance

- Preserve the sketch's controls, labels, grouping, and layout. Design-system guidance styles those controls; it must not introduce unrelated dashboards, navigation, branding, or business workflows.
- Include selected visual guidance in full-generation and patch prompts. Explicit user instructions can refine the sketch and styling.
- Describe generated HTML as a prototype with design-system-inspired styling. Do not claim certified design-system conformance, native component usage, or deployed ServiceNow integration. Lit source is a separate draft requiring platform validation.

## Verification and local servers

- For scheduling, provider, stream, or patch changes, run `pnpm test:patch`. Add focused regression tests for changed behavior; avoid tests that merely repeat implementation details.
- Run `pnpm typecheck` and `git diff --check`. Run `pnpm build` for application or dependency changes, or when preparing a release. Documentation-only changes do not require an application build.
- Verify visible UI changes in a browser, including a narrow viewport. State whether speech/provider responses were simulated and whether live verification remains incomplete.
- Respect the user's control of their app server. Do not stop or restart a user-managed server without authorization. Use a separate temporary copy/port for isolated checks when appropriate, and stop servers you started when finished.
- Stop a production server before rebuilding the directory it serves. Otherwise it can request obsolete JavaScript/CSS assets. Use `pnpm dev` for source edits during development; `pnpm start` serves the compiled build.

## Secrets, documentation, and licenses

- Never commit or print API keys. `.env.local` is private; `.env.example` contains placeholders. Avoid private sketch content in fixtures, recordings, or issue reports.
- Update README when setup or user-visible behavior changes. Keep claims consistent with actual behavior and document verification limits.
- `dailyprogress.md` is intentionally ignored and remains local. Update it for session handoff when requested; do not force-add it to Git.
- Preserve the MIT project license and separate third-party notices when redistributing bundled assets.
- Keep the Next.js-managed block below intact; development tooling can regenerate it. `CLAUDE.md` references this file.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
