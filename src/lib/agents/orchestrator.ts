/* ============================================
   Agent Orchestrator
   Manages the full pipeline with SSE streaming
   ============================================ */

import { generateScript } from './script-writer';
import { generateScenePrompts } from './scene-director';
import { generateStoryboard } from './storyboard-generator';
import { generateVideos } from './video-producer';
import { generateAudio } from './audio-producer';
import { analyzeViralPotential, generateImprovedScript } from './viral-optimizer';
import type {
  GenerationRequest,
  PipelineState,
  SSEEvent,
  ScriptOutput,
  ViralScore,
} from '../types';

type SSEWriter = (event: SSEEvent) => void;

function createInitialSteps() {
  return [
    { id: 'script', name: 'Script Writer', icon: '✍️', status: 'waiting' as const, description: 'Crafting viral script with hook, narrative & CTA' },
    { id: 'scenes', name: 'Scene Director', icon: '🎬', status: 'waiting' as const, description: 'Creating cinematic scene prompts' },
    { id: 'storyboard', name: 'Storyboard Generator', icon: '🎨', status: 'waiting' as const, description: 'Generating visual storyboard frames' },
    { id: 'video', name: 'Video Producer', icon: '🎥', status: 'waiting' as const, description: 'Animating scenes into video clips' },
    { id: 'audio', name: 'Audio Producer', icon: '🔊', status: 'waiting' as const, description: 'Creating narration & sound effects' },
    { id: 'viral', name: 'Viral Optimizer', icon: '📈', status: 'waiting' as const, description: 'Analyzing viral potential & scoring' },
  ];
}

function startAudioStep(
  script: ScriptOutput,
  style: string,
  topic: string,
  state: PipelineState,
  emit: SSEWriter
): Promise<void> {
  emit({ type: 'step_update', stepId: 'audio', status: 'running' });

  return generateAudio(script, style, topic)
    .then((audio) => {
      state.audio = audio;
      emit({ type: 'step_update', stepId: 'audio', status: 'complete' });
      emit({ type: 'step_output', stepId: 'audio', data: audio });
    });
}

/**
 * Run the full generation pipeline with SSE progress updates.
 */
export async function runPipeline(
  request: GenerationRequest,
  emit: SSEWriter
): Promise<PipelineState> {
  const state: PipelineState = {
    sessionId: crypto.randomUUID(),
    status: 'running',
    steps: createInitialSteps(),
  };

  try {
    // === Step 1: Script Writer ===
    emit({ type: 'step_update', stepId: 'script', status: 'running' });

    const script = await generateScript(request.topic, request.style);
    state.script = script;

    emit({ type: 'step_update', stepId: 'script', status: 'complete' });
    emit({ type: 'step_output', stepId: 'script', data: script });

    const audioPromise = startAudioStep(script, request.style, request.topic, state, emit);

    // === Step 2: Scene Director ===
    emit({ type: 'step_update', stepId: 'scenes', status: 'running' });

    const scenePrompts = await generateScenePrompts(script.scenes, request.style);
    state.scenePrompts = scenePrompts;

    emit({ type: 'step_update', stepId: 'scenes', status: 'complete' });
    emit({ type: 'step_output', stepId: 'scenes', data: scenePrompts });

    // === Step 3: Storyboard Generator ===
    emit({ type: 'step_update', stepId: 'storyboard', status: 'running' });

    const storyboard = await generateStoryboard(scenePrompts, request.format);
    state.storyboard = storyboard;

    emit({ type: 'step_update', stepId: 'storyboard', status: 'complete' });
    emit({ type: 'step_output', stepId: 'storyboard', data: storyboard });

    // === Step 4: Video Producer ===
    emit({ type: 'step_update', stepId: 'video', status: 'running' });

    const videos = await generateVideos(storyboard, scenePrompts, request.format);
    state.videos = videos;
    state.finalVideoUrl = videos[0]?.videoUrl;

    emit({ type: 'step_update', stepId: 'video', status: 'complete' });
    emit({ type: 'step_output', stepId: 'video', data: videos });

    await audioPromise;

    // === Step 6: Viral Optimizer ===
    emit({ type: 'step_update', stepId: 'viral', status: 'running' });

    const viralScore = await analyzeViralPotential(script);
    state.viralScore = viralScore;

    emit({ type: 'step_update', stepId: 'viral', status: 'complete' });
    emit({ type: 'step_output', stepId: 'viral', data: viralScore });

    // === Pipeline Complete ===
    state.status = 'complete';
    emit({ type: 'pipeline_complete', data: state });

    return state;
  } catch (error) {
    state.status = 'error';
    state.error = error instanceof Error ? error.message : 'Unknown error';
    emit({ type: 'pipeline_error', error: state.error });
    return state;
  }
}

/**
 * Run the "Make It More Viral" improvement loop.
 */
export async function runImprovementPipeline(
  originalScript: ScriptOutput,
  viralScore: ViralScore,
  format: '9:16' | '16:9',
  style: string,
  emit: SSEWriter
): Promise<PipelineState> {
  const state: PipelineState = {
    sessionId: crypto.randomUUID(),
    status: 'running',
    steps: createInitialSteps(),
  };

  try {
    // === Step 1: Rewrite Script ===
    emit({ type: 'step_update', stepId: 'script', status: 'running' });

    const improvedScript = await generateImprovedScript(originalScript, viralScore);
    state.script = improvedScript;

    emit({ type: 'step_update', stepId: 'script', status: 'complete' });
    emit({ type: 'step_output', stepId: 'script', data: improvedScript });

    const audioPromise = startAudioStep(improvedScript, style, improvedScript.fullScript, state, emit);

    // === Step 2: New Scene Prompts ===
    emit({ type: 'step_update', stepId: 'scenes', status: 'running' });

    const scenePrompts = await generateScenePrompts(
      improvedScript.scenes,
      style as 'cinematic' | 'energetic' | 'minimal' | 'dramatic' | 'inspirational'
    );
    state.scenePrompts = scenePrompts;

    emit({ type: 'step_update', stepId: 'scenes', status: 'complete' });
    emit({ type: 'step_output', stepId: 'scenes', data: scenePrompts });

    // === Step 3: Regenerate Storyboard ===
    emit({ type: 'step_update', stepId: 'storyboard', status: 'running' });

    const storyboard = await generateStoryboard(scenePrompts, format);
    state.storyboard = storyboard;

    emit({ type: 'step_update', stepId: 'storyboard', status: 'complete' });
    emit({ type: 'step_output', stepId: 'storyboard', data: storyboard });

    // === Step 4: Regenerate Videos ===
    emit({ type: 'step_update', stepId: 'video', status: 'running' });

    const videos = await generateVideos(storyboard, scenePrompts, format);
    state.videos = videos;
    state.finalVideoUrl = videos[0]?.videoUrl;

    emit({ type: 'step_update', stepId: 'video', status: 'complete' });
    emit({ type: 'step_output', stepId: 'video', data: videos });

    await audioPromise;

    // === Step 6: Re-analyze Viral Score ===
    emit({ type: 'step_update', stepId: 'viral', status: 'running' });

    const newViralScore = await analyzeViralPotential(improvedScript, true);
    state.viralScore = newViralScore;

    emit({ type: 'step_update', stepId: 'viral', status: 'complete' });
    emit({ type: 'step_output', stepId: 'viral', data: newViralScore });

    // === Complete ===
    state.status = 'complete';
    emit({ type: 'pipeline_complete', data: state });

    return state;
  } catch (error) {
    state.status = 'error';
    state.error = error instanceof Error ? error.message : 'Unknown error';
    emit({ type: 'pipeline_error', error: state.error });
    return state;
  }
}
