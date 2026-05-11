/* ============================================
   Agent 2 — Scene Director (Self-Contained)
   Converts scripts into cinematic prompts
   NO external LLM needed
   ============================================ */

import type { SceneScript, ScenePrompt, ContentStyle } from '../types';

// ---- Camera Angles ----
const CAMERA_ANGLES = [
  "Slow cinematic dolly-in",
  "Low angle hero shot",
  "Overhead top-down view",
  "Tracking dolly shot",
  "Close-up macro detail",
  "Wide establishing shot",
  "Dutch angle dramatic tilt",
  "Slow orbit around subject",
  "Push-in focus pull",
  "Smooth steadicam follow",
];

// ---- Lighting Presets ----
const LIGHTING_PRESETS: Record<string, string[]> = {
  "dramatic tension": ["High-contrast chiaroscuro with deep shadows", "Moody blue-toned sidelighting"],
  "tension, vulnerability": ["Soft desaturated lighting with harsh overhead accent", "Cool blue backlight with warm key"],
  "hope, turning point": ["Volumetric golden light rays breaking through clouds", "Warm sunrise tones with lens flare"],
  "energy, revelation": ["Neon-accented dynamic lighting", "High-energy strobe with color shifts"],
  "triumph, inspiration": ["Golden hour backlight with lens flare", "Warm cinematic glow, film grain"],
  "wonder, anticipation": ["Blue hour atmospheric haze", "Soft diffused dawn light"],
  "determination, intensity": ["Hard directional spotlight, high contrast", "Dramatic rim lighting"],
  "eureka, excitement": ["Ethereal self-illuminated glow", "Electric blue and purple accent lights"],
  "achievement, awe": ["Epic sunset panoramic lighting", "Grand cinematic golden wash"],
  "contrast, awareness": ["Split lighting — warm vs cool", "Hard shadow line dividing frame"],
  "discovery, focus": ["Precise focused spotlight, dark surroundings", "Clinical white light on detail"],
  "transformation, flow": ["Shifting gradient color wash", "Time-lapse evolving natural light"],
  "revelation, power": ["Dramatic backlight explosion", "Epic lens flare with warm tones"],
};

// ---- Style Modifiers ----
const STYLE_MODIFIERS: Record<ContentStyle, string> = {
  cinematic: "cinematic 4K, film grain, anamorphic lens, depth of field, color graded, professional cinematography",
  energetic: "vibrant colors, high saturation, dynamic composition, motion blur, fast-paced energy, bold contrasts",
  minimal: "clean composition, negative space, muted palette, soft focus, elegant simplicity, refined aesthetics",
  dramatic: "intense shadows, high contrast, dramatic atmosphere, moody tones, powerful composition, visual tension",
  inspirational: "warm golden tones, soft light, uplifting atmosphere, hopeful imagery, natural beauty, emotional warmth",
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLighting(mood: string): string {
  const key = Object.keys(LIGHTING_PRESETS).find((k) => mood.toLowerCase().includes(k));
  if (key) {
    return randomPick(LIGHTING_PRESETS[key]);
  }
  // Default fallback
  return randomPick([
    "Soft cinematic lighting with warm undertones",
    "Natural ambient light with subtle fill",
    "Dramatic three-point studio lighting",
  ]);
}

/**
 * Generate detailed visual prompts for each scene.
 * No external LLM — uses intelligent prompt engineering.
 */
export async function generateScenePrompts(
  scenes: SceneScript[],
  style: ContentStyle
): Promise<ScenePrompt[]> {
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 600));

  const styleModifier = STYLE_MODIFIERS[style];

  return scenes.map((scene) => {
    const cameraAngle = randomPick(CAMERA_ANGLES);
    const lighting = getLighting(scene.mood);

    // Build a rich visual prompt combining scene description with style
    const visualPrompt = `${scene.description}, ${lighting}, ${cameraAngle}, ${styleModifier}, photorealistic, ultra-detailed, professional production quality`;

    return {
      id: scene.id,
      visualPrompt: visualPrompt.substring(0, 1000), // Runway limit
      cameraAngle,
      lighting,
      mood: scene.mood,
      duration: scene.duration,
    };
  });
}
