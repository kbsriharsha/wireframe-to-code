# Wireframe Studio

Turn an Excalidraw sketch into a working HTML prototype with Gemini. Draw a layout, add typed or spoken instructions, choose a visual style, and watch the generated code stream into the studio.

## What you can do

- Sketch a screen with Excalidraw and generate a standalone HTML preview.
- Choose ServiceNow Horizon, ServiceNow Lit (AIUX), Material Design 3, shadcn/ui, Apple Human Interface, or Modern neutral as the visual style.
- Choose a listed Gemini model or enter a custom Gemini model ID.
- Use **Auto** for generation after edits, or click **Generate** when ready.
- Inspect or edit the HTML, switch between desktop and mobile preview widths, and export the HTML file.
- With ServiceNow Lit (AIUX) selected, generate and export a separate draft Lit widget source file.

## Requirements

- Node.js 22.13.0 or newer.
- A [Google AI Studio API key](https://aistudio.google.com/apikey) with access to your chosen Gemini model.
- Internet access for installation and Gemini requests. Voice input also needs a browser that supports speech recognition and microphone permission.

## Run locally

1. Clone or download this repository and open a terminal in the folder containing `package.json`.
2. Install the pinned pnpm version and dependencies:

   ```sh
   npm install -g pnpm@11.25.0
   pnpm install --frozen-lockfile
   ```

3. Create `.env.local` in the project root with your API key:

   ```dotenv
   GEMINI_API_KEY=your_google_ai_studio_key
   ```

4. Start the app:

   ```sh
   pnpm dev
   ```

5. Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Restart the server after changing `.env.local`. You can also leave that file out and enter a key through **Connect Gemini** in the app. `.env.local` is ignored by Git; keep your real key out of commits, screenshots, and issue reports.

## Generate an interface

1. Select a **Model** and **Design system** in the header.
2. Draw on the canvas and edit the interface instructions below it. **Speak instructions** adds finalized speech recognition results to a separate, editable transcript.
3. Leave **Auto** on to generate shortly after each change, or turn it off and use **Generate** to control API usage.
4. View the result in **Preview** or inspect and edit it in **HTML**. **Export** downloads the current HTML prototype.

**Clear canvas** removes the drawing, preview, and spoken instructions, and stops the microphone. Typed interface instructions remain so you can reuse them for a new sketch.

When **ServiceNow Lit (AIUX)** is selected, the **AIUX Lit** tab offers **Generate Lit source** and **Export Lit**. This is a separate, on-demand draft for an Employee Slate widget. Review and validate it in your ServiceNow environment before use.

## How generation works

Each request generates a **complete HTML document** from the current sketch and instructions. The app does not apply incremental code edits. HTML streams into the **HTML** tab; **Preview** continues showing the last completed document until the new one finishes. Auto waits about 400 ms after a change before starting a request. Frequent edits can trigger repeated requests and reach your Gemini quota, so turn Auto off when you want to batch changes.

The design system choice guides the generated appearance. The standalone HTML preview does not install native ServiceNow, Material UI, shadcn/ui, or Apple components. The Lit draft is source code, not a UI Builder page or a deployed ServiceNow component.

The local server uses `GEMINI_API_KEY` from `.env.local` when present. That key stays on the server and is sent to Gemini for requests. A key entered in **Connect Gemini** stays in the browser tab's memory and is sent to the local server for generation; it is lost on refresh. The app does not persist drawings, transcripts, or generated code. Export work you want to keep before refreshing or closing the tab. Browser speech recognition may use an online transcription service provided by your browser.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server at `127.0.0.1:3000`. |
| `pnpm typecheck` | Check TypeScript types. |
| `pnpm build` | Build the production app. |
| `pnpm start` | Serve the production build at `127.0.0.1:3000`. |

For production mode on your computer, run `pnpm build` followed by `pnpm start`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing key or connection error | Set `GEMINI_API_KEY` in `.env.local` and restart the server, or enter a key in **Connect Gemini**. |
| Model error | Choose a model available to your Google project, or enter a valid custom Gemini model ID. |
| Rate limit | Turn **Auto** off, wait for quota to recover, or choose a model with available quota. |
| Blank or older preview during generation | Wait for the full HTML response. Check the status message if generation fails. |
| Microphone unavailable | Allow microphone access and use a browser with speech recognition. Typed instructions still work. |
| Port 3000 in use | Stop the other server, or run `pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3001`. |

## Project files

- `app/page.tsx`: canvas, controls, generation scheduling, preview, code editor, and export.
- `app/api/generate/route.ts`: Gemini request validation and streaming proxy.
- `lib/design-systems.ts`: design system options and generation guidance.
- `app/globals.css`: studio styling.
- `public/excalidraw/fonts/`: locally bundled drawing fonts.

This project produces standalone interface prototypes. It does not connect to a ServiceNow instance or import pages into UI Builder.
