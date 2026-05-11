/* ============================================
   Agent 4 - Video Producer
   Animates storyboard images into video clips
   with limited concurrency and retry backoff.
   ============================================ */

import { generateVideoFromImage } from '../runway-client';
import { mapWithConcurrency } from './concurrency';
import type { StoryboardScene, ScenePrompt, VideoScene, ContentFormat } from '../types';

const VIDEO_CONCURRENCY = 2;

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateSceneVideo(
  scene: StoryboardScene,
  scenePrompts: ScenePrompt[],
  format: ContentFormat
): Promise<VideoScene> {
  const matchingPrompt = scenePrompts.find((p) => p.id === scene.id);
  const animationPrompt = matchingPrompt
    ? `${matchingPrompt.visualPrompt}, smooth cinematic motion, gentle camera movement`
    : scene.prompt;

  let videoUrl: string | null = null;
  let lastError = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Video Producer] Scene ${scene.id} - attempt ${attempt}/2`);
      videoUrl = await generateVideoFromImage(
        scene.imageUrl,
        animationPrompt.substring(0, 1000),
        format,
        scene.duration
      );
      console.log(`[Video Producer] Scene ${scene.id} - video generated`);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[Video Producer] Scene ${scene.id} attempt ${attempt} failed: ${lastError}`);
      if (attempt < 2) {
        console.log(`[Video Producer] Retrying scene ${scene.id} in 5s...`);
        await wait(5000);
      }
    }
  }

  if (!videoUrl) {
    console.warn(`[Video Producer] Scene ${scene.id} - using storyboard fallback after all retries`);
  }

  return {
    id: scene.id,
    videoUrl: videoUrl || scene.imageUrl,
    imageUrl: scene.imageUrl,
    duration: scene.duration,
  };
}

export async function generateVideos(
  storyboard: StoryboardScene[],
  scenePrompts: ScenePrompt[],
  format: ContentFormat
): Promise<VideoScene[]> {
  return mapWithConcurrency(storyboard, VIDEO_CONCURRENCY, (scene) =>
    generateSceneVideo(scene, scenePrompts, format)
  );
}
