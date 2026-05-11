/* ============================================
   Agent 1 - Script Writer (Self-Contained)
   Generates viral scripts with precise duration
   control for audio/video sync.
   ============================================ */

import type { ContentStyle, ScriptOutput } from '../types';
import {
  REEL_SCENE_COUNT,
  REEL_SCENE_DURATION,
  REEL_TOTAL_DURATION,
  getNarrationWordBudget,
} from '../reel-config';

const HOOK_TEMPLATES: Record<ContentStyle, string[]> = {
  cinematic: [
    "What if everything you knew about {topic} was wrong?",
    "Nobody talks about this side of {topic}.",
    "This is the moment {topic} changed forever.",
  ],
  energetic: [
    "STOP scrolling. This {topic} hack is insane!",
    "POV: You just discovered the secret to {topic}.",
    "This {topic} trick went viral for a reason.",
  ],
  minimal: [
    "The simple truth about {topic}.",
    "One shift that transforms {topic}.",
    "The quiet power of {topic}.",
  ],
  dramatic: [
    "They said {topic} was impossible. They were wrong.",
    "Warning: This will change how you see {topic}.",
    "The shocking reality behind {topic}.",
  ],
  inspirational: [
    "Your {topic} journey starts now.",
    "Imagine mastering {topic} in just 30 days.",
    "Every expert started exactly where you are.",
  ],
};

const NARRATIVE_TEMPLATES: Record<ContentStyle, string[]> = {
  cinematic: [
    "The top performers all share one habit. They focus on consistency, not intensity. The compound effect builds faster than you expect.",
    "Behind every success is a pattern most people miss. It is not talent. It is systematic practice, repeated when nobody is watching.",
  ],
  energetic: [
    "Here is the breakdown. Most people overcomplicate this. The real secret is simple. Apply it daily and watch everything change.",
    "Okay, here is the move. Start with mindset. Add consistency. Protect your patience. That combination changes everything.",
  ],
  minimal: [
    "One insight changes everything. Focus beats hustle. Less beats more. When the noise drops, the answer gets obvious.",
    "Strip away the noise. Focus on fundamentals. Act on what works. Let the results speak for themselves.",
  ],
  dramatic: [
    "The evidence is undeniable. For years we were taught the wrong lesson. Now the pattern is clear, and it changes everything.",
    "What they will not tell you is simple. The research proves it. The data confirms it. The implications are hard to ignore.",
  ],
  inspirational: [
    "Every journey begins somewhere. The path will not always feel clear. Keep moving, and your future self will thank you.",
    "Believe in the process. Trust the growth. You are closer than you think. One step today becomes momentum tomorrow.",
  ],
};

const CTA_TEMPLATES: Record<ContentStyle, string[]> = {
  cinematic: [
    "Follow for more. Save this before it disappears.",
    "Share this with someone who needs it.",
  ],
  energetic: [
    "Drop a comment if this hit. Follow for more!",
    "Like, save, and follow for daily value!",
  ],
  minimal: [
    "Follow for more clarity.",
    "Bookmark this. Follow for daily insights.",
  ],
  dramatic: [
    "Share this now. Everyone needs to see it.",
    "Save this. Follow for more truth.",
  ],
  inspirational: [
    "Your journey starts now. Follow for daily motivation.",
    "Tag someone who needs this today.",
  ],
};

const SCENE_TEMPLATES = [
  [
    { description: "A person facing a challenge related to {topic}, looking determined under dramatic lighting", mood: "tension, anticipation" },
    { description: "Focused close-up of the first practical shift in {topic}, confident hands in motion", mood: "clarity, action" },
    { description: "Dynamic transformation montage showing progress in {topic}, fast cuts, energy and motion", mood: "energy, momentum" },
    { description: "The triumphant result, a confident person embodying {topic} mastery in golden hour light", mood: "triumph, inspiration" },
  ],
  [
    { description: "Cinematic wide shot establishing the world of {topic}, atmospheric fog, moody lighting", mood: "wonder, atmosphere" },
    { description: "Close-up details and textures related to {topic}, macro shots revealing hidden beauty", mood: "discovery, focus" },
    { description: "A clean step-by-step visual of the hidden pattern behind {topic}, modern editorial framing", mood: "insight, momentum" },
    { description: "Final epic reveal of the complete picture of {topic}, panoramic composition, warm golden tones", mood: "revelation, power" },
  ],
  [
    { description: "Split screen contrast showing wrong versus right approach to {topic}, sharp visual divide", mood: "contrast, awareness" },
    { description: "Person making one decisive change toward {topic}, crisp movement, focused expression", mood: "decision, progress" },
    { description: "Time-lapse transformation showing {topic} evolution, fluid morphing visuals, neon accents", mood: "transformation, flow" },
    { description: "Empowering final shot of a person walking forward into bright light, {topic} theme, uplifting", mood: "empowerment, hope" },
  ],
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

function extractTopic(rawTopic: string): string {
  let topic = rawTopic
    .replace(/^(create|make|generate|build|produce)\s+(a|an|the)?\s*/i, '')
    .replace(/^(motivational|cinematic|viral|short|quick|energetic|dramatic|inspirational)\s+(reel|video|content|clip|short)?\s*(for|about|on|regarding)?\s*/i, '')
    .replace(/^(reel|video|content|clip|short)\s*(for|about|on|regarding)?\s*/i, '')
    .trim();
  if (topic.length < 3) topic = rawTopic;
  return topic;
}

function trimToWordBudget(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}.`;
}

function buildTimedVoiceover(hook: string, narrative: string, cta: string): {
  fullScript: string;
  narrative: string;
} {
  const maxWords = getNarrationWordBudget(REEL_TOTAL_DURATION);
  const fixedWords = `${hook} ${cta}`.split(/\s+/).filter(Boolean).length;
  const narrativeBudget = Math.max(maxWords - fixedWords, 8);
  const trimmedNarrative = trimToWordBudget(narrative, narrativeBudget);
  const fullScript = trimToWordBudget(`${hook} ${trimmedNarrative} ${cta}`, maxWords);

  return {
    fullScript,
    narrative: trimmedNarrative,
  };
}

function splitNarrative(narrative: string): [string, string] {
  const sentences = narrative.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    const midpoint = Math.ceil(sentences.length / 2);
    return [
      sentences.slice(0, midpoint).join(' '),
      sentences.slice(midpoint).join(' '),
    ];
  }

  const words = narrative.split(/\s+/).filter(Boolean);
  const midpoint = Math.ceil(words.length / 2);
  return [
    words.slice(0, midpoint).join(' '),
    words.slice(midpoint).join(' '),
  ];
}

export async function generateScript(
  rawTopic: string,
  style: ContentStyle,
): Promise<ScriptOutput> {
  await new Promise((r) => setTimeout(r, 300));

  const topic = extractTopic(rawTopic);
  const totalDuration = REEL_SCENE_COUNT * REEL_SCENE_DURATION;

  const hook = fillTemplate(randomPick(HOOK_TEMPLATES[style]), { topic });
  const rawNarrative = randomPick(NARRATIVE_TEMPLATES[style]);
  const cta = fillTemplate(randomPick(CTA_TEMPLATES[style]), { topic });
  const { fullScript, narrative } = buildTimedVoiceover(hook, rawNarrative, cta);
  const [firstBeat, secondBeat] = splitNarrative(narrative);
  const sceneSet = randomPick(SCENE_TEMPLATES);

  const scenes = sceneSet.map((scene, i) => ({
    id: i + 1,
    description: fillTemplate(scene.description, { topic }),
    dialogue: i === 0 ? hook : i === sceneSet.length - 1 ? cta : i === 1 ? firstBeat : secondBeat,
    duration: totalDuration / REEL_SCENE_COUNT,
    mood: scene.mood,
  }));

  return {
    hook,
    narrative,
    cta,
    fullScript,
    scenes,
    voiceoverText: fullScript,
  };
}
