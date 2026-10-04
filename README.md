# Wireframe Studio — local edition

An Excalidraw canvas beside a streaming interface preview. Choose a design system, then draw, speak, or type instructions to generate HTML.

## Requirements

- Node.js 22.13 or newer (Node.js 24 also works).
- Internet access to install dependencies and call Gemini.
- A Google AI Studio Gemini API key with access to the model you choose.
- A browser with microphone access for voice instructions. Chrome is recommended for browser speech recognition.

## Quick start (macOS, Windows PowerShell, or Linux)

1. Extract the ZIP. Open Terminal or PowerShell in the `wireframe-studio` folder containing `package.json`.
2. Verify Node.js:

   ```sh
   node --version
   ```

3. Install the package manager and project dependencies:

   ```sh
   npm install -g pnpm@11.25.0
   pnpm install --frozen-lockfile
   ```

4. Run the studio:

   ```sh
   pnpm dev
   ```

5. Open **http://localhost:3000**. Keep the terminal running. Press **Ctrl+C** to stop.

No ChatGPT login, Sites account, Cloudflare account, database, or hosting setup is required for this local edition.

## Connect Gemini and generate

1. Open `.env.local` and paste your Google AI Studio key after `GEMINI_API_KEY=`. Obtain one at https://aistudio.google.com/apikey. Restart the studio after changing this file. You can still enter a key through **Connect Gemini** if the file is blank.
2. Use the **Design system** dropdown to choose ServiceNow Horizon, ServiceNow Lit (AIUX), Material Design 3, shadcn/ui, Apple Human Interface, or Modern neutral. The selection guides generated colors, typography, controls, and spacing.
3. Choose a model in the header: Gemini 3.1 Flash-Lite, 3.5 Flash-Lite, 3.5 Flash, or 3.8 Flash. The default is `gemini-3.5-flash-lite`. Choose **Custom model…** to enter another Gemini model ID, then click **Use**. Model availability and quotas depend on your Google project.
4. Draw shapes, text, and arrows on the canvas. With **Auto** enabled, generation starts 400 ms after the latest drawing, finalized browser speech segment, or instruction edit. Click **Generate** at any time.
5. Click **Speak instructions** to add voice input through browser speech recognition, or type instructions below the canvas.
6. Use **Clear canvas** to reset the sketch, preview, and spoken transcript. It also stops the microphone if it is listening. Typed interface instructions remain.
7. Switch between **Preview** and **HTML**. Export downloads the generated HTML prototype, not this entire source project. With ServiceNow Lit (AIUX) selected, open **AIUX Lit** and click **Generate Lit source** to create a separate draft widget source file. **Export Lit** downloads that JavaScript draft.

The preview reproduces a selected design system's visual language in standalone HTML. It does not install native Material UI, shadcn/ui, Apple, or ServiceNow components. The optional AIUX Lit output is draft source for an Employee Slate widget and needs review and validation in a ServiceNow instance before use.

Each preview generation creates a complete HTML document from the current canvas and instructions. It does not patch the previous code. The **HTML** tab shows incoming code, while **Preview** keeps the last complete document until the new one finishes. AIUX Lit source is requested separately so automatic preview generation stays fast; changing the drawing or instructions clears the previous Lit draft.

When set in `.env.local`, your Gemini key stays on the local server and is never sent to the browser. A key entered through **Connect Gemini** instead stays in tab memory and is lost on refresh. The local server binds to loopback only. `.env.local` is excluded by `.gitignore`; do not commit a copy of your key elsewhere.

Browser speech recognition may use the browser provider's online transcription service. The studio does not save audio, drawings, or generated HTML between sessions. The key in `.env.local` remains on disk until you remove it. Export anything you want to keep before closing or refreshing. Gemini calls may incur API charges; turn off **Auto** when you do not need it.

## Production mode on your computer

```sh
pnpm build
pnpm start
```

Open http://localhost:3000. Build once after source changes, then start. `pnpm dev` is simpler for editing and automatically reloads changes.

## Troubleshooting

- **Node or pnpm command not found:** install Node.js, restart your terminal, and run the commands again.
- **Global pnpm installation denied:** instead use `npx --yes pnpm@11.25.0 install --frozen-lockfile`, then `npx --yes pnpm@11.25.0 dev`. The same prefix works for `build` and `start`.
- **Port 3000 is busy:** stop the other server, or run `pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3001` and visit http://localhost:3001.
- **Microphone does not work:** use a browser with speech recognition, allow microphone permission, check the input device, and visit localhost rather than opening a file directly. Typed instructions remain available.
- **Gemini model/key error:** check `GEMINI_API_KEY` in `.env.local` and restart the server, or check the key in connection settings. Choose a model in the header and click **Generate** to retry.
- **Rate limit:** turn off **Auto** and retry later, check your Gemini quota and billing settings, or choose another model with available quota.
- **Blank preview while generating:** the document arrives in chunks; wait for generation to finish. If it fails, check the displayed status and connection settings.
- **Cannot run offline:** the canvas is local, but Gemini generation and browser speech transcription require network connectivity.

## Source map

- `app/page.tsx`: Excalidraw editor, generation scheduling, preview, code editor, and export.
- `app/api/generate/route.ts`: Gemini streaming proxy and request validation.
- `lib/design-systems.ts`: available design systems and generation guidance.
- `app/globals.css`: studio styling.
- `app/layout.tsx`: document metadata and root layout.
- `components/ui/`: dialog, tabs, switch, and button primitives used by the studio.
- `lib/utils.ts`: shared class-name utilities.
- `public/excalidraw/fonts/`: bundled drawing fonts, served locally.
- `vendor/`: shared UI CSS and license notices.
- `package.json`, `pnpm-lock.yaml`: dependencies and commands.
- `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`: local framework, styling, and TypeScript configuration.

This download retains the published studio's feature code and assets, with standalone Next.js commands replacing Sites deployment machinery. Unused hosting, authentication, and connector scaffolding is omitted. The generated interfaces are standalone prototypes; this is not a native ServiceNow UI Builder importer or a connection to a ServiceNow instance.

## Verification

The app was checked with TypeScript and a local Next.js production build. `gemini-3.5-flash-lite` generated HTML from typed instructions and from a sketch image with drawing elements; `gemini-3.1-flash-lite` also generated a complete HTML preview. The ServiceNow Lit option was checked with live API requests for both a complete HTML preview and streamed Lit widget source. Microphone capture requires browser permission and was not verified here.
