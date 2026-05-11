# ReelForge AI

ReelForge AI is a Next.js app that turns a content idea into a short-form reel pipeline: script, scene prompts, storyboard images, animated video clips, narration, background sound, viral scoring, and MP4 export.

The app is built for creator-style reels with real-time pipeline progress and format support for vertical reels and widescreen videos.

## Screenshots

### Home and Idea Input

![ReelForge AI home screen](docs/screenshots/01-home.png)

### Generation Form

![Generation form with topic, style, format, and upload controls](docs/screenshots/02-generation-form.png)

### Agent Pipeline

![Completed six-agent pipeline](docs/screenshots/03-agent-pipeline.png)

### Generated Video Clips

![Generated reel video clips](docs/screenshots/04-generated-clips.png)

### Storyboard, Audio, and Script

![Storyboard, narration audio, background SFX, and script preview](docs/screenshots/05-storyboard-audio-script.png)

### Final Reel Preview

![Final vertical reel preview with playback and download controls](docs/screenshots/06-final-reel-preview.png)

### Viral Analysis

![Viral analysis dashboard with score, suggestions, and improvement loop](docs/screenshots/07-viral-analysis.png)

## Features

- Six-step AI creative pipeline with Server-Sent Events progress updates and per-agent completion percentages.
- Script generation with hook, narrative, CTA, scene dialogue, and narration timing.
- Scene prompt generation for cinematic visual direction.
- Runway image and video generation with limited concurrency and retry/fallback behavior.
- Context-aware narration voice selection using Runway Text-to-Speech presets.
- Ambient background sound generation through Runway/ElevenLabs sound effects.
- Narration normalization to match the final reel duration.
- Viral score dashboard with hook, visual impact, emotional resonance, and pacing feedback.
- "Make It More Viral" improvement loop that rewrites and regenerates the reel.
- MP4 export with scene concatenation, optional burned captions, narration, and SFX mixing.

## Voice Selection

Narration voice is selected automatically from the reel style, topic, script text, and scene moods. The current natural creator voice palette is:

| Style | Male preset | Female preset | Default gender |
| --- | --- | --- | --- |
| cinematic | Mark | Serene | male |
| energetic | James | Kylie | male |
| minimal | Noah | Eleanor | female |
| dramatic | Elias | Mabel | male |
| inspirational | Arjun | Rachel | female |

The old energetic male preset `Elliot` is no longer used by the app's context-aware voice selection. It remains only in the low-level Runway preset allowlist because it is still a valid provider preset.

## Pipeline

1. Script Writer creates a short-form script, CTA, and four timed scene beats.
2. Scene Director turns each beat into visual prompts, camera direction, lighting, and mood.
3. Storyboard Generator creates image frames with Runway Text-to-Image.
4. Video Producer animates storyboard frames with Runway Image-to-Video.
5. Audio Producer creates narration and background SFX, then normalizes narration duration.
6. Viral Optimizer scores the result and suggests improvements.

Default reel timing is four scenes at five seconds each, for a 20 second reel.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Runway SDK
- ElevenLabs models through Runway for narration and sound effects
- FFmpeg and FFprobe via `ffmpeg-static` and `ffprobe-static`
- Framer Motion
- Lucide React

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` with your Runway key:

```bash
RUNWAYML_API_SECRET=your_runway_api_secret
MOCK_MODE=false
```

Optional local media binary overrides:

```bash
FFMPEG_BIN=C:\path\to\ffmpeg.exe
FFPROBE_BIN=C:\path\to\ffprobe.exe
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

On Windows PowerShell, if execution policy blocks `npm.ps1`, use:

```bash
npm.cmd run dev
```

## Scripts

```bash
npm run dev      # Start the Next.js dev server
npm run build    # Build production assets and run TypeScript checks
npm run start    # Start the production server after build
npm run lint     # Run ESLint
```

## API Routes

- `POST /api/generate` - starts the full generation pipeline and streams SSE events.
- `POST /api/improve` - runs the viral improvement loop from an existing script and score.
- `POST /api/export-reel` - exports generated scenes and audio as an MP4 download.

Generation requests use:

```ts
{
  topic: string;
  style: 'cinematic' | 'energetic' | 'minimal' | 'dramatic' | 'inspirational';
  format: '9:16' | '16:9';
  referenceImageUrl?: string;
}
```

## Environment Notes

- `RUNWAYML_API_SECRET` is required unless `MOCK_MODE=true`.
- `MOCK_MODE=true` avoids real Runway calls and returns sample media URLs for local testing.
- API routes have a 300 second max duration because image, video, audio, and export jobs can take time.
- Export uses temporary files and cleans them up after the MP4 response is created.

## Project Structure

```text
src/app/                  Next.js pages and API routes
src/components/           UI for input, pipeline progress, previews, player, and viral score
src/lib/agents/           Script, scene, storyboard, video, audio, and viral agents
src/lib/runway-client.ts  Runway API wrapper, retries, mock mode, and voice preset validation
src/lib/server/           FFmpeg, FFprobe, download, and audio normalization helpers
src/lib/types.ts          Shared request, response, pipeline, and media types
```

## Troubleshooting

- **`Cannot find module 'framer-motion'` or `components.ComponentMod.handler is not a function`**: Turbopack's cache may be corrupted. Stop the server, delete the `.next` directory (`rm -rf .next` or `Remove-Item -Recurse -Force .next`), run `npm install`, and restart the dev server.
- **`listen EADDRINUSE: address already in use 127.0.0.1:3000`**: A previous Next.js server instance is still running in the background. Find the process using port 3000 (`netstat -ano | findstr :3000` on Windows, or `lsof -i :3000` on Mac/Linux) and terminate it.

## Verification

Recommended checks before shipping changes:

```bash
npm.cmd run lint
npm.cmd run build
```

Use `npm run ...` instead if your shell does not block npm scripts.
