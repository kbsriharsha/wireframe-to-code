# Wireframe Studio

Draw an interface, describe a change, and preview a working HTML prototype with Gemini or OpenAI.

Wireframe Studio combines an Excalidraw canvas, browser speech recognition, streamed HTML generation, and targeted edits in a local Next.js app. The sketch supplies the layout; your instructions refine it; the selected design system guides its appearance.

## Features

- **Draw and generate:** turn a wireframe into standalone HTML with embedded CSS and JavaScript.
- **Edit incrementally:** automatic canvas, typed, and spoken changes patch the current page after its first generation.
- **Speak visibly:** a large live transcript above the preview condenses to the latest instruction, with queued, applying, success, and error feedback. Full spoken history remains editable below the canvas.
- **Choose your LLM:** Gemini or OpenAI, provider-specific model options, and custom Gemini model IDs.
- **Choose a visual style:** ServiceNow Horizon, ServiceNow Lit (AIUX), Material Design 3, shadcn/ui, Apple Human Interface, or Modern neutral.
- **Inspect and export:** edit the generated HTML, switch preview widths, resize the canvas/preview panels, and download the prototype.
- **Optional Lit draft:** generate and export separate AIUX-style Lit source when ServiceNow Lit is selected.

## Quick start

Requires **Node.js 22.13.0+**, **pnpm 11.25.0**, and an API key with access to your selected provider and model. Internet access is needed for installation and generation.

```sh
git clone https://github.com/kbsriharsha/wireframe-to-code.git
cd wireframe-to-code
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Add either or both keys to `.env.local`:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
OPENAI_API_KEY=your_openai_api_key
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey) or [OpenAI](https://platform.openai.com/api-keys). Model availability and quotas depend on your provider account; dropdown options do not guarantee access.

```sh
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Restart the server after changing `.env.local`. You can also enter a key in **LLM settings**; server environment keys take precedence over keys entered in the browser.

The repository uses pnpm and its committed lockfile. npm is used above only to install pnpm.

## Your first prototype

1. Select a **Provider**, **Model**, and **Design system**.
2. For a controlled first sketch, turn **Auto** off, draw your screen, and add typed instructions below the canvas.
3. Click **Generate** and review the result in **Preview** or **HTML**.
4. Turn **Auto** on, then draw or describe small changes.
5. Use **Export** to download the current HTML.

**Speak instructions** uses browser speech recognition and requires microphone permission and a supported browser. The latest utterance appears above the preview while speaking. Finalized segments condense after a 350 ms pause; display cleanup only normalizes whitespace and makes no additional model request. The microphone stays listening for the next instruction. With Auto off, speech is retained and shows **Ready · Auto off** until you generate manually.

Drag the divider to resize canvas and preview, use arrow keys while it is focused, or double-click to reset. Narrow screens stack the panels. **Desktop/Mobile** changes the preview width; it does not generate another page.

**Clear canvas** cancels active and queued work, clears the drawing, preview, and speech history, and stops the microphone. Typed instructions remain.

## Generation behavior

| Action | Result |
| --- | --- |
| First generation or **Generate** | Build a complete HTML document. |
| Automatic canvas edit | Patch the current HTML using an updated sketch image and element changes since the last successful result. |
| Automatic typed or spoken edit | Patch the current HTML without exporting another sketch image, unless canvas changes are also pending. |
| Change design system | Queue a full rebuild, even with Auto off, after active generation finishes. |
| Change provider/model | Preserve the output; apply the selection to the next request. |
| Invalid or ambiguous patch | Keep the existing HTML and successful sketch baseline; show an error. |

Auto waits until a drawing gesture finishes, then about **500 ms**. Typed instructions wait **1 second**. Speech waits for finalized recognition and its **350 ms** pause. New edits during generation are collected into one pending update; the active request finishes before a fresh pause starts for the follow-up. Partial speech and active drawing gestures defer automatic work.

Full generation streams a draft into the preview with scripts disabled; the completed document enables local interactions. Patches keep the existing preview visible until validated replacements succeed. Status appears below the Preview/HTML tabs: **Building your interface…**, **Updating your edit…**, or queued feedback. Speech-related requests show **Applying change…** and **Updated**.

If an edit is too broad for a targeted patch, refine it or click **Generate** for a complete rebuild. Switching models does not retry a failed request by itself.

## Limitations

- Generated output is an **AI-produced prototype**, requiring review before use. Sketch fidelity, design consistency, responsiveness, and accessibility can vary.
- Visual styles are **inspired by** the selected design system. Standalone HTML does not install native ServiceNow, Material UI, shadcn/ui, or Apple components, and no design-system conformance is certified.
- AIUX Lit output is a separate on-demand draft, not a deployed widget or UI Builder page. Validate imports and behavior in your ServiceNow environment.
- No application database, authentication flow, ServiceNow connection, or production backend is generated by this studio.
- Drawings, transcripts, keys entered in the browser, and generated output are not saved by the studio across reloads. Export work you want to retain. Excalidraw's own save/load tools can save drawings separately.

## Data and API usage

This is a **local development tool**. The included server binds to `127.0.0.1`; its generation endpoint has no user authentication or rate limiting. Do not expose it as a public service with a shared server key without adding those controls.

Generation sends instructions and, when needed, sketch images and element data to the selected provider. Patches also send the current HTML. Provider usage may incur charges and is subject to that provider's data handling policies. Browser speech recognition may send audio to your browser's transcription service.

Server keys remain on the server; `/api/generate` reports only whether each provider is configured. Browser-entered keys stay in tab memory and are sent to the local server for requests. Keep real keys out of Git, recordings, and issue reports. `.env.local` is ignored; `.env.example` contains placeholders only.

## Development and verification

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server at `127.0.0.1:3000`. |
| `pnpm typecheck` | Check TypeScript types. |
| `pnpm test:patch` | Test scene deltas, provider request contracts, queued generation, patch safety, and speech presentation without calling live models. |
| `pnpm build` | Create the production build. |
| `pnpm start` | Serve the existing production build at `127.0.0.1:3000`. |

For production mode, run `pnpm build` then `pnpm start`. After source edits, **stop the production server, rebuild, then restart it**. Building while an old server runs can leave it requesting obsolete JavaScript/CSS assets. Use `pnpm dev` for source changes during development.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and verification steps.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing key or connection error | Configure the selected provider and restart, or enter a key in LLM settings. |
| Model error | Select a model accessible to your account; Gemini allows custom IDs. |
| Rate limit | Turn Auto off and retry after your provider quota recovers. |
| Patch rejected | Keep the current preview, refine the edit, or use Generate. |
| Old UI, disabled controls, or missing assets | Stop the production server, rebuild, restart, then reload. |
| Microphone unavailable | Check browser speech-recognition support and microphone permission; typed instructions work independently. |
| Port 3000 in use | Use `pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3001` for another development port. |

## Project structure

- `app/page.tsx`: studio controls, speech recognition, scheduling, preview, and export.
- `app/api/generate/route.ts`: provider request validation and streaming proxy.
- `lib/`: model options, visual guidance, scene comparison, stream parsing, patch validation, and speech presentation.
- `components/`: studio components and UI primitives.
- `tests/`: regression tests with mocked provider responses.
- `public/excalidraw/fonts/`: bundled drawing fonts.

## Credits

Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), and [Excalidraw](https://github.com/excalidraw/excalidraw). UI primitives use Radix UI and shadcn-style components. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for bundled asset copyrights and licenses.

## License

This project is licensed under the [MIT License](LICENSE). Bundled third-party assets retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
