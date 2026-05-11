# ReelForge AI Hackathon Demo Video Script

Target length: 3 to 4 minutes  
Tone: confident, practical, startup-demo style  
Format: screen recording with voiceover

## 0:00 - 0:15 - Opening Hook

Screen:
- Show the ReelForge AI home page.
- Slowly move over the idea input, style options, and generate button.

Voiceover:
Hi everyone, this is ReelForge AI, an autonomous creative studio that turns a simple content idea into a complete short-form reel. Instead of manually writing a script, creating visuals, generating clips, adding voiceover, mixing audio, and exporting the final video, ReelForge handles the full workflow in one pipeline.

## 0:15 - 0:35 - Problem

Screen:
- Show a simple slide or keep the app visible while highlighting the input area.

Voiceover:
Short-form content is powerful, but creating it is slow. A creator has to plan the hook, write the narration, design scenes, generate or edit visuals, choose a voice, add music, create captions, and then export everything in the right format. For students, startups, creators, and small teams, that process can take hours for one reel.

## 0:35 - 0:55 - Solution Overview

Screen:
- Show the hero section and the app flow.
- Point at the "6 AI Agents" and real-time pipeline UI if visible.

Voiceover:
ReelForge AI solves this by using a six-agent pipeline. Each agent is responsible for one part of the creative process: script writing, scene direction, storyboard generation, video production, audio production, and viral optimization. The user only needs to enter an idea, choose a style, choose a format, and start generation.

## 0:55 - 1:25 - Start A Generation

Screen:
- Type an example prompt:
  "Create a motivational reel for students preparing for exams"
- Select a style, for example "Inspirational" or "Energetic".
- Select "9:16 TikTok / Reels".
- Click "Generate Viral Reel".

Voiceover:
For this demo, I will create a motivational reel for students preparing for exams. I can choose the creative style, such as cinematic, energetic, minimal, dramatic, or inspirational. I can also choose the output format: vertical 9:16 for reels and shorts, or 16:9 for YouTube-style videos. Once I click generate, the pipeline starts in real time.

## 1:25 - 2:00 - Explain The Agent Pipeline

Screen:
- Show the Agent Pipeline section while steps update.
- If generation takes time, zoom into each completed step output.

Voiceover:
The first agent writes a short-form script with a hook, narrative, CTA, and timed scene dialogue. The second agent converts that script into scene prompts with mood, camera direction, and visual style. The third agent generates storyboard images using Runway. The fourth agent animates those images into short video clips. The fifth agent creates narration and ambient background sound, then normalizes the voiceover so it matches the final reel duration. Finally, the viral optimizer scores the content across hook power, visual impact, emotional resonance, and pacing.

## 2:00 - 2:25 - Voice And Audio Highlight

Screen:
- Show the audio/narration section in the preview.
- Point to the displayed voice preset and gender.

Voiceover:
One important feature is context-aware narration. ReelForge does not use one fixed voice for every video. It looks at the topic, style, script, and scene mood, then selects a male or female voice that fits the reel. For example, energetic male content now uses the James preset, energetic female content uses Kylie, and inspirational female content uses Rachel. This makes the final output feel more aligned with the style of the reel.

## 2:25 - 2:55 - Preview The Result

Screen:
- Show generated storyboard/video preview.
- Play the generated reel preview if available.
- Show captions and audio if present.

Voiceover:
Here is the generated result. ReelForge gives us the scenes, the video clips, narration, background sound, and the script that drives the entire reel. The app also keeps the preview transparent, so I can see what was generated at each stage instead of only getting a final black-box output.

## 2:55 - 3:20 - Viral Optimization Loop

Screen:
- Show the Viral Score dashboard.
- Highlight hook power, visual impact, emotional resonance, pacing, and suggestions.
- Click "Make It More Viral" if you want to show the improvement loop.

Voiceover:
After generation, the viral optimizer gives a score and practical suggestions. If the reel needs improvement, I can run the "Make It More Viral" loop. That rewrites the script, improves the hook or CTA, regenerates the scenes, and produces a stronger version of the reel. This turns the app from a simple generator into an iterative creative assistant.

## 3:20 - 3:40 - Export

Screen:
- Show the final reel player.
- Click export/download if the output is ready.

Voiceover:
When the result is ready, ReelForge can export the final MP4. The export process combines all scenes, burns captions if enabled, mixes narration with background sound, and returns a ready-to-share video file.

## 3:40 - 4:00 - Technical Closing

Screen:
- Show a quick architecture slide or the README/project structure.
- Optionally show code folders: app routes, agents, Runway client, media tools.

Voiceover:
Technically, ReelForge AI is built with Next.js, React, TypeScript, the Runway SDK, and FFmpeg. The pipeline streams progress through API routes using Server-Sent Events, and media export is handled server-side with FFmpeg and FFprobe. The result is a complete AI-powered reel creation workflow, built for fast content generation, iteration, and export.

## 4:00 - 4:10 - Final Line

Screen:
- Return to the final generated reel or app home page.

Voiceover:
That is ReelForge AI: from idea to script, visuals, voice, viral score, and final reel in one creative pipeline. Thank you.

## Backup Lines If Generation Takes Longer

Use these lines while waiting for Runway generation:

- Because this app generates real images, videos, narration, and sound, some steps take longer than a normal text-only AI response.
- The pipeline is designed to continue even if a visual generation step fails, using graceful fallbacks so the demo can still complete.
- Audio generation runs in parallel after the script is ready, which helps reduce total waiting time.
- The final export is handled separately so users can preview and improve the reel before downloading the MP4.

## Recommended Demo Prompt Options

Use one of these if you want a reliable hackathon-friendly demo:

1. Create a motivational reel for students preparing for exams
2. Startup productivity app launch trailer
3. Morning routine of a successful entrepreneur
4. Why most people fail at learning new skills

## Quick Presentation Tips

- Keep the prompt simple and relatable.
- Use 9:16 format for a stronger short-form demo.
- Choose "Inspirational" for a clean motivational showcase.
- Mention that the app supports mock mode for safe testing and real Runway mode for production output.
- If the live generation is slow, show a previously generated reel while explaining the running pipeline.
