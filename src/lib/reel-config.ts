export const REEL_SCENE_DURATION = 5;
export const REEL_SCENE_COUNT = 4;
export const REEL_TOTAL_DURATION = REEL_SCENE_COUNT * REEL_SCENE_DURATION;

export const WARM_CREATOR_VOICE_PRESET = 'Maya';

const TTS_SAFE_WORDS_PER_SECOND = 2.35;
const TTS_SAFETY_SECONDS = 0.5;

export function getNarrationWordBudget(targetSeconds: number = REEL_TOTAL_DURATION): number {
  return Math.floor(Math.max(targetSeconds - TTS_SAFETY_SECONDS, 1) * TTS_SAFE_WORDS_PER_SECOND);
}
