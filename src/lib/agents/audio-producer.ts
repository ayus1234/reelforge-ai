/* ============================================
   Agent 5 - Audio Producer
   Generates narration and SFX matched to the
   final reel duration for sync.
   ============================================ */

import { generateNarration, generateSoundEffect, type RunwayVoicePreset } from '../runway-client';
import { normalizeAudioToDuration } from '../server/media-tools';
import type { ScriptOutput, AudioOutput, ContentStyle, VoiceGender } from '../types';

interface VoiceSelection {
  preset: RunwayVoicePreset;
  gender: VoiceGender;
  reason: string;
}

const STYLE_VOICES: Record<ContentStyle, { male: RunwayVoicePreset; female: RunwayVoicePreset; defaultGender: VoiceGender }> = {
  cinematic: { male: 'Mark', female: 'Serene', defaultGender: 'male' },
  energetic: { male: 'James', female: 'Kylie', defaultGender: 'male' },
  minimal: { male: 'Noah', female: 'Eleanor', defaultGender: 'female' },
  dramatic: { male: 'Elias', female: 'Mabel', defaultGender: 'male' },
  inspirational: { male: 'Arjun', female: 'Rachel', defaultGender: 'female' },
};

const MALE_SIGNALS = [
  'business', 'startup', 'founder', 'finance', 'money', 'invest', 'tech', 'technology',
  'coding', 'developer', 'ai', 'fitness', 'gym', 'discipline', 'masculine', 'men',
  'documentary', 'cinematic', 'trailer', 'warrior', 'leadership', 'career', 'productivity',
  'sports', 'entrepreneur',
];

const FEMALE_SIGNALS = [
  'beauty', 'fashion', 'makeup', 'skincare', 'lifestyle', 'wellness', 'healing',
  'calm', 'minimal', 'aesthetic', 'mother', 'women', 'female', 'soft', 'emotional',
  'self care', 'home', 'routine', 'mindfulness', 'travel', 'food', 'relationship',
  'inspirational',
];

function countSignals(text: string, signals: string[]): number {
  return signals.reduce((score, signal) => (
    text.includes(signal) ? score + (signal.includes(' ') ? 2 : 1) : score
  ), 0);
}

function selectVoice(script: ScriptOutput, style: string, topic: string = ''): VoiceSelection {
  const safeStyle = (style in STYLE_VOICES ? style : 'cinematic') as ContentStyle;
  const styleVoice = STYLE_VOICES[safeStyle];
  const searchable = `${topic} ${safeStyle} ${script.hook} ${script.narrative} ${script.cta} ${script.scenes.map((s) => `${s.description} ${s.mood}`).join(' ')}`.toLowerCase();

  let maleScore = countSignals(searchable, MALE_SIGNALS);
  let femaleScore = countSignals(searchable, FEMALE_SIGNALS);

  if (styleVoice.defaultGender === 'male') maleScore += 1;
  else femaleScore += 1;

  const gender: VoiceGender = maleScore > femaleScore ? 'male' : 'female';
  const preset = styleVoice[gender];
  const reason = maleScore === femaleScore
    ? `${safeStyle} style fallback selected ${gender} voice`
    : `${gender} voice selected from topic/style signals (${maleScore} male, ${femaleScore} female)`;

  return { preset, gender, reason };
}

/**
 * Generate voiceover narration and ambient sound effects.
 * Narration is normalized to the total video duration before returning.
 */
export async function generateAudio(
  script: ScriptOutput,
  style: string,
  topic: string = ''
): Promise<AudioOutput> {
  const totalDuration = script.scenes.reduce((sum, s) => sum + s.duration, 0);
  const voice = selectVoice(script, style, topic);

  console.log(`[Audio Producer] Target duration: ${totalDuration}s | Voice: ${voice.preset} (${voice.gender})`);
  console.log(`[Audio Producer] Voiceover text (${script.voiceoverText.split(/\s+/).length} words): "${script.voiceoverText.substring(0, 80)}..."`);

  const [narrationResult, sfxResult] = await Promise.allSettled([
    generateNarration(script.voiceoverText, voice.preset),
    generateSoundEffect(
      `Warm creator reel background bed, ${style} mood, subtle cinematic underscore, no lyrics, gentle and atmospheric, supports narration without overpowering it`,
      totalDuration
    ),
  ]);

  const rawNarrationUrl = narrationResult.status === 'fulfilled' ? narrationResult.value : '';
  let narrationUrl = rawNarrationUrl;
  let narrationDuration = 0;

  if (rawNarrationUrl) {
    try {
      const normalized = await normalizeAudioToDuration(rawNarrationUrl, totalDuration, 'narration');
      narrationUrl = normalized.url;
      narrationDuration = normalized.duration;
      console.log(
        `[Audio Producer] Narration normalized: raw ${normalized.rawDuration?.toFixed(2) || 'unknown'}s -> ${normalized.duration.toFixed(2)}s`
      );
    } catch (error) {
      console.warn('[Audio Producer] Narration normalization failed, using raw narration:', error);
    }
  }

  const sfxUrl = sfxResult.status === 'fulfilled' ? sfxResult.value : '';

  if (narrationResult.status === 'rejected') {
    console.warn('[Audio Producer] Narration failed:', narrationResult.reason);
  }
  if (sfxResult.status === 'rejected') {
    console.warn('[Audio Producer] SFX failed:', sfxResult.reason);
  }

  console.log(
    `[Audio Producer] Narration: ${narrationUrl ? 'yes' : 'no'} | SFX: ${sfxUrl ? 'yes' : 'no'}`
  );

  return {
    narrationUrl,
    rawNarrationUrl: rawNarrationUrl && rawNarrationUrl !== narrationUrl ? rawNarrationUrl : undefined,
    sfxUrl,
    voicePreset: voice.preset,
    voiceGender: voice.gender,
    voiceReason: voice.reason,
    narrationDuration: narrationDuration || totalDuration,
    totalDuration,
  };
}
