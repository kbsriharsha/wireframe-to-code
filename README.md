# Wireframe Studio

Turn an Excalidraw sketch into a working HTML prototype with Gemini or OpenAI. Draw a layout, add typed or spoken instructions, choose a visual style, and watch the generated code stream into the studio.

## What you can do

- Sketch a screen with Excalidraw and generate a standalone HTML preview.
- Choose ServiceNow Horizon, ServiceNow Lit (AIUX), Material Design 3, shadcn/ui, Apple Human Interface, or Modern neutral as the visual style.
- Choose Gemini or OpenAI, then select a model for that provider. Gemini also accepts a custom model ID.
- Use **Auto** for generation after edits, or click **Generate** when ready.
- Inspect or edit the HTML, switch between desktop and mobile preview widths, and export the HTML file.
- With ServiceNow Lit (AIUX) selected, generate and export a separate draft Lit widget source file.

## Requirements

- Node.js 22.13.0 or newer.
- A [Google AI Studio API key](https://aistudio.google.com/apikey) or an [OpenAI API key](https://platform.openai.com/api-keys) with access to your chosen model.
- Internet access for installation and model requests. Voice input also needs a browser that supports speech recognition and microphone permission.

## Run locally

1. Clone or download this repository and open a terminal in the folder containing `package.json`.
2. Install the pinned pnpm version and dependencies:

   ```sh
   npm install -g pnpm@11.25.0
   pnpm install --frozen-lockfile
   ```

3. Create `.env.local` in the project root with the key for either or both providers:

   ```dotenv
   GEMINI_API_KEY=your_google_ai_studio_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the app:

   ```sh
   pnpm dev
   ```

5. Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Restart the server after changing `.env.local`. You can also enter a key through **LLM settings** in the app. `.env.local` is ignored by Git; keep your real keys out of commits, screenshots, and issue reports.

## Generate an interface

1. Select a **Provider**, **Model**, and **Design system** in the header.
2. Draw on the canvas and edit the interface instructions below it. **Speak instructions** adds finalized speech recognition results to a separate, editable transcript.
3. Leave **Auto** on to generate after you pause, or turn it off and use **Generate** for an immediate request.
4. View the result in **Preview** or inspect and edit it in **HTML**. **Export** downloads the current HTML prototype.

**Clear canvas** removes the drawing, preview, and spoken instructions, and stops the microphone. Typed interface instructions remain so you can reuse them for a new sketch.

When **ServiceNow Lit (AIUX)** is selected, the **AIUX Lit** tab offers **Generate Lit source** and **Export Lit**. This is a separate, on-demand draft for an Employee Slate widget. Review and validate it in your ServiceNow environment before use.

## How generation works

The first request generates a **complete HTML document** from the sketch and instructions. Later typed and spoken instruction edits ask the selected model for small replacements in the current HTML, so the preview updates without rewriting the whole page. These patch requests skip drawing image export and keep the existing preview visible until the edit succeeds. If the edit cannot identify one exact target, the current HTML stays intact; rephrase the instruction or click **Generate** for a full rebuild. Sketch and model or design system changes also rebuild the full page.

During a full rebuild, HTML streams into the **HTML** tab and **Preview** shows a visual draft as soon as usable page markup arrives. Auto waits until a drawing gesture ends, then about 600 ms; typed instructions wait about one second, and finalized speech uses a shorter pause. New edits cancel an active request and start a new one after the pause. Turn Auto off to control API usage.

The design system choice guides the generated appearance. The standalone HTML preview does not install native ServiceNow, Material UI, shadcn/ui, or Apple components. The Lit draft is source code, not a UI Builder page or a deployed ServiceNow component.

The local server uses `GEMINI_API_KEY` or `OPENAI_API_KEY` from `.env.local` for the selected provider when present. The server sends that provider's key only to its API. A key entered in **LLM settings** stays in the browser tab's memory and is sent to the local server for generation; it is lost on refresh. The app does not persist drawings, transcripts, or generated code. Export work you want to keep before refreshing or closing the tab. Browser speech recognition may use an online transcription service provided by your browser.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server at `127.0.0.1:3000`. |
| `pnpm typecheck` | Check TypeScript types. |
| `pnpm test:patch` | Check targeted HTML edits and safe failure behavior. |
| `pnpm build` | Build the production app. |
| `pnpm start` | Serve the production build at `127.0.0.1:3000`. |

For production mode on your computer, run `pnpm build` followed by `pnpm start`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing key or connection error | Set the selected provider's key in `.env.local` and restart the server, or enter it in **LLM settings**. |
| Model error | Choose a model available to your provider account. Gemini also supports a custom model ID. |
| Rate limit | Turn **Auto** off, wait for quota to recover, or choose a model with available quota. |
| Blank or older preview during generation | The draft appears after usable page markup arrives. Check the status message if generation fails. |
| Microphone unavailable | Allow microphone access and use a browser with speech recognition. Typed instructions still work. |
| Port 3000 in use | Stop the other server, or run `pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3001`. |

## Project files

- `app/page.tsx`: canvas, controls, generation scheduling, preview, code editor, and export.
- `app/api/generate/route.ts`: Gemini and OpenAI request validation and streaming proxy.
- `lib/llm.ts`: provider model options and validation.
- `lib/design-systems.ts`: design system options and generation guidance.
- `app/globals.css`: studio styling.
- `public/excalidraw/fonts/`: locally bundled drawing fonts.

This project produces standalone interface prototypes. It does not connect to a ServiceNow instance or import pages into UI Builder.
