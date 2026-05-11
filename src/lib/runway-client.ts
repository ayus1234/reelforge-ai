/* ============================================
   ReelForge AI — Runway Client (Production)
   Full API integration with error handling & retries
   ============================================ */

import RunwayML from '@runwayml/sdk';
import type { ContentFormat } from './types';

let client: RunwayML | null = null;

function getClient(): RunwayML {
  if (!client) {
    if (!process.env.RUNWAYML_API_SECRET) {
      throw new Error('RUNWAYML_API_SECRET environment variable is not set');
    }
    client = new RunwayML({
      apiKey: process.env.RUNWAYML_API_SECRET,
    });
  }
  return client;
}

function isMock(): boolean {
  return process.env.MOCK_MODE === 'true';
}

function getVideoRatio(format: ContentFormat): '1280:720' | '720:1280' {
  return format === '16:9' ? '1280:720' : '720:1280';
}

function getImageRatio(format: ContentFormat): '1920:1080' | '1080:1920' {
  return format === '16:9' ? '1920:1080' : '1080:1920';
}

// ---- Mock Data ----
const MOCK_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
];

const MOCK_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const MOCK_AUDIO_URL = 'https://www.soundjay.com/human/sounds/applause-01.mp3';

export const RUNWAY_VOICE_PRESETS = [
  'Maya', 'Arjun', 'Serene', 'Bernard', 'Billy', 'Mark', 'Clint', 'Mabel',
  'Chad', 'Leslie', 'Eleanor', 'Elias', 'Elliot', 'Grungle', 'Brodie',
  'Sandra', 'Kirk', 'Kylie', 'Lara', 'Lisa', 'Malachi', 'Marlene', 'Martin',
  'Miriam', 'Monster', 'Paula', 'Pip', 'Rusty', 'Ragnar', 'Xylar', 'Maggie',
  'Jack', 'Katie', 'Noah', 'James', 'Rina', 'Ella', 'Mariah', 'Frank',
  'Claudia', 'Niki', 'Vincent', 'Kendrick', 'Myrna', 'Tom', 'Wanda',
  'Benjamin', 'Kiana', 'Rachel',
] as const;

export type RunwayVoicePreset = typeof RUNWAY_VOICE_PRESETS[number];

/**
 * Retry wrapper for Runway API calls with exponential backoff.
 * Handles rate limits (429) and transient failures.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Runway] ${label} — attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      console.log(`[Runway] ${label} — success`);
      return result;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const isRateLimit = err.status === 429;
      const isServerError = err.status && err.status >= 500;
      const isRetryable = isRateLimit || isServerError;

      console.error(`[Runway] ${label} — attempt ${attempt} failed:`, err.message || error);

      if (!isRetryable || attempt === maxRetries) {
        throw new Error(`Runway API (${label}): ${err.message || 'Unknown error'}`);
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[Runway] Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Runway API (${label}): max retries exceeded`);
}

/**
 * Generate a storyboard image using Runway Text-to-Image (gen4_image)
 */
export async function generateImage(
  prompt: string,
  format: ContentFormat,
  _sceneIndex: number
): Promise<string> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 2000));
    return MOCK_IMAGE_URLS[_sceneIndex % MOCK_IMAGE_URLS.length];
  }

  return withRetry(async () => {
    const runway = getClient();
    const task = await runway.textToImage
      .create({
        model: 'gen4_image',
        promptText: prompt.substring(0, 1000), // API limit: 1000 chars
        ratio: getImageRatio(format),
      })
      .waitForTaskOutput();

    if (!task.output || task.output.length === 0) {
      throw new Error('No image output returned from Runway');
    }

    return task.output[0];
  }, `Image generation (scene ${_sceneIndex + 1})`);
}

/**
 * Generate video from storyboard image using Runway Image-to-Video (gen4_turbo)
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  format: ContentFormat,
  duration: number = 5
): Promise<string> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 3000));
    return MOCK_VIDEO_URL;
  }

  return withRetry(async () => {
    const runway = getClient();
    const task = await runway.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptImage: imageUrl,
        promptText: prompt.substring(0, 1000), // API limit: 1000 chars
        ratio: getVideoRatio(format),
        duration: Math.min(Math.max(Math.round(duration), 2), 10),
      })
      .waitForTaskOutput();

    if (!task.output || task.output.length === 0) {
      throw new Error('No video output returned from Runway');
    }

    return task.output[0];
  }, 'Video generation (image-to-video)');
}

/**
 * Generate video from text only (gen4.5 — text-to-video)
 */
export async function generateVideoFromText(
  prompt: string,
  format: ContentFormat,
  duration: number = 5
): Promise<string> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 3000));
    return MOCK_VIDEO_URL;
  }

  return withRetry(async () => {
    const runway = getClient();
    const task = await runway.textToVideo
      .create({
        model: 'gen4.5',
        promptText: prompt.substring(0, 1000),
        ratio: getVideoRatio(format),
        duration: Math.min(Math.max(Math.round(duration), 2), 10),
      })
      .waitForTaskOutput();

    if (!task.output || task.output.length === 0) {
      throw new Error('No video output returned from Runway');
    }

    return task.output[0];
  }, 'Video generation (text-to-video)');
}

/**
 * Generate narration using Runway Text-to-Speech (ElevenLabs)
 */
export async function generateNarration(
  text: string,
  voicePreset: string = 'Serene'
): Promise<string> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_AUDIO_URL;
  }

  // Fallback to 'Serene' if invalid preset
  const safePreset: RunwayVoicePreset = RUNWAY_VOICE_PRESETS.includes(voicePreset as RunwayVoicePreset)
    ? (voicePreset as RunwayVoicePreset)
    : 'Serene';

  return withRetry(async () => {
    const runway = getClient();
    const task = await runway.textToSpeech
      .create({
        model: 'eleven_multilingual_v2',
        promptText: text.substring(0, 1000), // API limit: 1000 chars
        voice: {
          type: 'runway-preset',
          presetId: safePreset,
        },
      })
      .waitForTaskOutput();

    if (!task.output || task.output.length === 0) {
      throw new Error('No narration output returned from Runway');
    }

    return task.output[0];
  }, `Narration generation (voice: ${safePreset})`);
}

/**
 * Generate sound effect using Runway (ElevenLabs SFX)
 */
export async function generateSoundEffect(
  description: string,
  duration: number = 10
): Promise<string> {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 1000));
    return MOCK_AUDIO_URL;
  }

  return withRetry(async () => {
    const runway = getClient();
    const task = await runway.soundEffect
      .create({
        model: 'eleven_text_to_sound_v2',
        promptText: description.substring(0, 1000),
        duration: Math.min(Math.max(duration, 0.5), 30),
      })
      .waitForTaskOutput();

    if (!task.output || task.output.length === 0) {
      throw new Error('No sound effect output returned from Runway');
    }

    return task.output[0];
  }, 'Sound effect generation');
}
