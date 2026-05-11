/* ============================================
   Agent 3 - Storyboard Generator
   Generates storyboard images via Runway with
   limited concurrency and graceful fallbacks.
   ============================================ */

import { generateImage } from '../runway-client';
import { mapWithConcurrency } from './concurrency';
import type { ScenePrompt, StoryboardScene, ContentFormat } from '../types';

const STORYBOARD_CONCURRENCY = 2;

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
];

export async function generateStoryboard(
  scenePrompts: ScenePrompt[],
  format: ContentFormat
): Promise<StoryboardScene[]> {
  const results = await mapWithConcurrency(scenePrompts, STORYBOARD_CONCURRENCY, async (scene) => {
    try {
      const imageUrl = await generateImage(
        scene.visualPrompt,
        format,
        scene.id - 1
      );

      console.log(`[Storyboard] Scene ${scene.id} - image generated`);

      return {
        id: scene.id,
        imageUrl,
        prompt: scene.visualPrompt,
        duration: scene.duration,
      };
    } catch (error) {
      console.warn(
        `[Storyboard] Scene ${scene.id} failed, using fallback:`,
        error instanceof Error ? error.message : error
      );

      return {
        id: scene.id,
        imageUrl: FALLBACK_IMAGES[(scene.id - 1) % FALLBACK_IMAGES.length],
        prompt: scene.visualPrompt,
        duration: scene.duration,
      };
    }
  });

  if (results.length === 0) {
    throw new Error('Storyboard Generator: all scenes failed to generate');
  }

  return results;
}
