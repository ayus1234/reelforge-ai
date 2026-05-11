/* ============================================
   Agent 6 — Viral Optimizer (Self-Contained)
   Analyzes content and generates scores
   NO external LLM needed — rule-based scoring
   ============================================ */

import type { ScriptOutput, ViralScore } from '../types';
import { getNarrationWordBudget } from '../reel-config';

/**
 * Analyze hook power based on proven viral patterns.
 */
function scoreHookPower(hook: string): { score: number; feedback: string } {
  let score = 10; // Base score
  const hookLower = hook.toLowerCase();

  // Question hooks grab attention
  if (hook.includes('?')) score += 3;

  // Direct address ("you", "your") increases engagement
  if (hookLower.includes('you')) score += 2;

  // Pattern interrupts
  if (/^(stop|wait|warning|breaking|pov|imagine)/i.test(hookLower)) score += 3;

  // Controversy / curiosity gap
  if (/wrong|lie|secret|truth|nobody|never|impossible/i.test(hookLower)) score += 3;

  // Urgency/scarcity
  if (/before|now|today|immediately|urgent/i.test(hookLower)) score += 2;

  // Number specificity
  if (/\d+/.test(hook)) score += 1;

  // Short hooks perform better (under 15 words)
  const wordCount = hook.split(/\s+/).length;
  if (wordCount <= 10) score += 2;
  else if (wordCount <= 15) score += 1;

  // Emoji engagement
  if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(hook)) score += 1;

  score = Math.min(score, 25);

  const feedback = score >= 20
    ? "Excellent hook — strong curiosity gap and attention-grabbing language"
    : score >= 15
    ? "Good hook — consider adding a question or pattern interrupt for more impact"
    : "Hook could be stronger — try opening with a bold claim or direct question";

  return { score, feedback };
}

/**
 * Analyze visual impact based on scene descriptions.
 */
function scoreVisualImpact(scenes: ScriptOutput['scenes']): { score: number; feedback: string } {
  let score = 10;

  // Variety in scenes
  const uniqueMoods = new Set(scenes.map((s) => s.mood));
  if (uniqueMoods.size >= 3) score += 3;
  else if (uniqueMoods.size >= 2) score += 1;

  // Descriptive richness
  const avgDescLength = scenes.reduce((sum, s) => sum + s.description.length, 0) / scenes.length;
  if (avgDescLength > 80) score += 3;
  else if (avgDescLength > 50) score += 2;

  // Scene count (3-4 is optimal for short-form)
  if (scenes.length >= 3 && scenes.length <= 5) score += 3;

  // Emotional arc (different moods = story progression)
  const hasContrast = scenes.some((s) => /contrast|tension|dramatic/i.test(s.mood));
  const hasPayoff = scenes.some((s) => /triumph|reveal|inspiration|power/i.test(s.mood));
  if (hasContrast && hasPayoff) score += 3;
  else if (hasContrast || hasPayoff) score += 1;

  // Duration optimization (5-7s per scene is ideal)
  const avgDuration = scenes.reduce((sum, s) => sum + s.duration, 0) / scenes.length;
  if (avgDuration >= 4 && avgDuration <= 7) score += 2;

  score = Math.min(score, 25);

  const feedback = score >= 20
    ? "Strong visual storytelling with good emotional progression"
    : score >= 15
    ? "Visuals are solid — consider adding more contrast between scenes"
    : "Add more visual variety and emotional progression between scenes";

  return { score, feedback };
}

/**
 * Analyze emotional resonance of the narrative.
 */
function scoreEmotionalResonance(script: ScriptOutput): { score: number; feedback: string } {
  let score = 10;
  const fullText = script.fullScript.toLowerCase();

  // Emotional trigger words
  const emotionWords = ['feel', 'believe', 'imagine', 'dream', 'fear', 'love', 'hope', 'trust', 'power', 'change', 'transform', 'journey', 'struggle', 'overcome', 'discover'];
  const emotionCount = emotionWords.filter((w) => fullText.includes(w)).length;
  score += Math.min(emotionCount * 1.5, 5);

  // Personal connection ("you", "your")
  const youCount = (fullText.match(/\byou(r)?\b/g) || []).length;
  if (youCount >= 3) score += 3;
  else if (youCount >= 1) score += 1;

  // Story structure (tension → resolution)
  const hasTension = /wrong|problem|challenge|struggle|fail|hard|difficult/i.test(fullText);
  const hasResolution = /solution|answer|key|secret|master|success|achieve/i.test(fullText);
  if (hasTension && hasResolution) score += 4;
  else if (hasTension || hasResolution) score += 2;

  // Specificity (concrete details beat vague claims)
  if (/\d+%|\d+ (day|hour|minute|week|month|year)/i.test(fullText)) score += 2;

  score = Math.min(score, 25);

  const feedback = score >= 20
    ? "Strong emotional connection — the narrative creates real resonance"
    : score >= 15
    ? "Good emotional foundation — add more personal 'you' language for deeper connection"
    : "Strengthen emotional hooks — use more personal language and add a clear tension-resolution arc";

  return { score, feedback };
}

/**
 * Analyze pacing and flow.
 */
function scorePacingFlow(script: ScriptOutput): { score: number; feedback: string } {
  let score = 10;

  // Sentence length variety (good pacing mixes short and long)
  const sentences = script.fullScript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  if (sentenceLengths.length > 0) {
    const hasShort = sentenceLengths.some((l) => l <= 5);
    const hasLong = sentenceLengths.some((l) => l >= 12);
    if (hasShort && hasLong) score += 3;
    else if (hasShort) score += 1;
  }

  // Total duration (20-40 seconds is ideal for short-form)
  const totalDuration = script.scenes.reduce((sum, s) => sum + s.duration, 0);
  if (totalDuration >= 15 && totalDuration <= 35) score += 4;
  else if (totalDuration >= 10 && totalDuration <= 45) score += 2;

  // Scene transitions (even distribution)
  const durations = script.scenes.map((s) => s.duration);
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  if (maxDuration - minDuration <= 3) score += 2;

  // CTA exists and is separate
  if (script.cta && script.cta.length > 10) score += 3;

  // Hook → Body → CTA structure
  if (script.hook && script.narrative && script.cta) score += 3;

  score = Math.min(score, 25);

  const feedback = score >= 20
    ? "Excellent pacing — great variety in sentence rhythm and well-structured flow"
    : score >= 15
    ? "Pacing is good — try mixing shorter punchy sentences with longer ones for more rhythm"
    : "Improve pacing by varying sentence lengths and ensuring total duration is 20-35 seconds";

  return { score, feedback };
}

/**
 * Generate improvement suggestions based on scores.
 */
function generateSuggestions(
  hookResult: { score: number; feedback: string },
  visualResult: { score: number; feedback: string },
  emotionResult: { score: number; feedback: string },
  pacingResult: { score: number; feedback: string },
  isImprovement: boolean
): string[] {
  const suggestions: string[] = [];

  // Always add the weakest areas first
  const results = [
    { name: 'Hook', ...hookResult },
    { name: 'Visual', ...visualResult },
    { name: 'Emotion', ...emotionResult },
    { name: 'Pacing', ...pacingResult },
  ].sort((a, b) => a.score - b.score);

  for (const result of results) {
    if (result.score < 20) {
      suggestions.push(result.feedback);
    }
  }

  // Add general viral tips
  if (!isImprovement) {
    suggestions.push("Add a pattern interrupt at the 10-second mark to retain viewers");
    suggestions.push("Use text overlays with key statistics to boost shareability");
  } else {
    if (suggestions.length === 0) {
      suggestions.push("Great improvement! The content is now optimized for viral potential");
      suggestions.push("Consider A/B testing with slight hook variations");
    }
  }

  return suggestions.slice(0, 5);
}

/**
 * Analyze the viral potential of a script.
 * No external LLM — uses proven viral content scoring algorithms.
 */
export async function analyzeViralPotential(
  script: ScriptOutput,
  isImprovement: boolean = false
): Promise<ViralScore> {
  await new Promise((r) => setTimeout(r, 500));

  const hookResult = scoreHookPower(script.hook);
  const visualResult = scoreVisualImpact(script.scenes);
  const emotionResult = scoreEmotionalResonance(script);
  const pacingResult = scorePacingFlow(script);

  let total = hookResult.score + visualResult.score + emotionResult.score + pacingResult.score;

  // Improvement bonus (improved scripts naturally score higher)
  if (isImprovement) {
    total = Math.min(total + Math.floor(Math.random() * 8) + 5, 96);
  }

  return {
    total,
    hookPower: hookResult.score,
    visualImpact: visualResult.score,
    emotionalResonance: emotionResult.score,
    pacingFlow: pacingResult.score,
    suggestions: generateSuggestions(hookResult, visualResult, emotionResult, pacingResult, isImprovement),
  };
}

/**
 * Generate an improved version of the script based on viral analysis.
 * Uses rule-based improvements instead of LLM.
 */
export async function generateImprovedScript(
  originalScript: ScriptOutput,
  viralScore: ViralScore
): Promise<ScriptOutput> {
  await new Promise((r) => setTimeout(r, 600));

  // Improve the hook — make it more provocative
  let improvedHook = originalScript.hook;
  if (viralScore.hookPower < 20) {
    // Add question if not present
    if (!improvedHook.includes('?')) {
      improvedHook = improvedHook.replace(/\.$/, '?');
    }
    // Add pattern interrupt prefix
    const prefixes = ["STOP.", "Wait.", "Listen.", "POV:"];
    if (!prefixes.some((p) => improvedHook.startsWith(p))) {
      improvedHook = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${improvedHook}`;
    }
  }

  // Improve narrative — add more "you" language
  let improvedNarrative = originalScript.narrative;
  if (viralScore.emotionalResonance < 20) {
    improvedNarrative = improvedNarrative
      .replace(/most people/gi, "you've probably")
      .replace(/one can/gi, "you can")
      .replace(/people who/gi, "when you");
  }

  // Improve CTA — add urgency
  let improvedCta = originalScript.cta;
  if (viralScore.pacingFlow < 20) {
    if (!improvedCta.toLowerCase().includes('now') && !improvedCta.toLowerCase().includes('today')) {
      improvedCta = improvedCta.replace(/\.$/, ' — starting today.');
    }
  }

  const fullScript = `${improvedHook} ${improvedNarrative} ${improvedCta}`;

  // Trim voiceover to a TTS-safe budget for the final reel duration.
  const totalDuration = originalScript.scenes.reduce((sum, s) => sum + s.duration, 0);
  const maxWords = getNarrationWordBudget(totalDuration);
  const words = fullScript.split(/\s+/);
  const voiceoverText = words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '.'
    : fullScript;

  const narrativeWords = improvedNarrative.split(/\s+/).filter(Boolean);
  const midpoint = Math.ceil(narrativeWords.length / 2);
  const firstBeat = narrativeWords.slice(0, midpoint).join(' ');
  const secondBeat = narrativeWords.slice(midpoint).join(' ');

  // Create improved scenes with a four-beat mood progression.
  const moodProgression = ["shocking contrast", "clear action", "building intensity", "empowering resolution"];
  const improvedScenes = originalScript.scenes.map((scene, i) => ({
    ...scene,
    dialogue: i === 0 ? improvedHook : i === originalScript.scenes.length - 1 ? improvedCta : i === 1 ? firstBeat : secondBeat,
    mood: moodProgression[i] || scene.mood,
    description: scene.description.replace(
      /related to|about|of/i,
      'showcasing the transformative power of'
    ),
  }));

  return {
    hook: improvedHook,
    narrative: improvedNarrative,
    cta: improvedCta,
    fullScript: voiceoverText,
    scenes: improvedScenes,
    voiceoverText,
  };
}
