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
  AgentStatus,
  AgentStep,
  GenerationRequest,
  PipelineState,
  SSEEvent,
  ScriptOutput,
  ViralScore,
} from '../types';

type SSEWriter = (event: SSEEvent) => void;
type PipelineStepId = 'script' | 'scenes' | 'storyboard' | 'video' | 'audio' | 'viral';

function createInitialSteps(): AgentStep[] {
  return [
    { id: 'script', name: 'Script Writer', icon: '✍️', status: 'waiting', progress: 0, description: 'Crafting viral script with hook, narrative & CTA' },
    { id: 'scenes', name: 'Scene Director', icon: '🎬', status: 'waiting', progress: 0, description: 'Creating cinematic scene prompts' },
    { id: 'storyboard', name: 'Storyboard Generator', icon: '🎨', status: 'waiting', progress: 0, description: 'Generating visual storyboard frames' },
    { id: 'video', name: 'Video Producer', icon: '🎥', status: 'waiting', progress: 0, description: 'Animating scenes into video clips' },
    { id: 'audio', name: 'Audio Producer', icon: '🔊', status: 'waiting', progress: 0, description: 'Creating narration & sound effects' },
    { id: 'viral', name: 'Viral Optimizer', icon: '📈', status: 'waiting', progress: 0, description: 'Analyzing viral potential & scoring' },
  ];
}

function updateStateStep(
  state: PipelineState,
  stepId: PipelineStepId,
  status: AgentStatus,
  progress: number
): void {
  state.steps = state.steps.map((step) =>
    step.id === stepId ? { ...step, status, progress } : step
  );
}

async function runStep<T>(
  stepId: PipelineStepId,
  state: PipelineState,
  emit: SSEWriter,
  work: () => Promise<T>,
  options: { initialProgress?: number; maxProgress?: number; tickMs?: number } = {}
): Promise<T> {
  const initialProgress = options.initialProgress ?? 8;
  const maxProgress = options.maxProgress ?? 92;
  const tickMs = options.tickMs ?? 900;
  let progress = initialProgress;

  updateStateStep(state, stepId, 'running', progress);
  emit({ type: 'step_update', stepId, status: 'running', progress });

  const timer = setInterval(() => {
    const remaining = maxProgress - progress;
    if (remaining <= 0) return;

    progress = Math.min(maxProgress, progress + Math.max(1, Math.ceil(remaining * 0.18)));
    updateStateStep(state, stepId, 'running', progress);
    emit({ type: 'step_update', stepId, status: 'running', progress });
  }, tickMs);

  try {
    const result = await work();
    clearInterval(timer);
    updateStateStep(state, stepId, 'complete', 100);
    emit({ type: 'step_update', stepId, status: 'complete', progress: 100 });
    return result;
  } catch (error) {
    clearInterval(timer);
    updateStateStep(state, stepId, 'error', progress);
    emit({ type: 'step_update', stepId, status: 'error', progress });
    throw error;
  }
}

function startAudioStep(
  script: ScriptOutput,
  style: string,
  topic: string,
  state: PipelineState,
  emit: SSEWriter
): Promise<void> {
  return runStep('audio', state, emit, () => generateAudio(script, style, topic))
    .then((audio) => {
      state.audio = audio;
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
    const script = await runStep('script', state, emit, () =>
      generateScript(request.topic, request.style)
    );
    state.script = script;

    emit({ type: 'step_output', stepId: 'script', data: script });

    const audioPromise = startAudioStep(script, request.style, request.topic, state, emit);

    // === Step 2: Scene Director ===
    const scenePrompts = await runStep('scenes', state, emit, () =>
      generateScenePrompts(script.scenes, request.style)
    );
    state.scenePrompts = scenePrompts;

    emit({ type: 'step_output', stepId: 'scenes', data: scenePrompts });

    // === Step 3: Storyboard Generator ===
    const storyboard = await runStep('storyboard', state, emit, () =>
      generateStoryboard(scenePrompts, request.format)
    );
    state.storyboard = storyboard;

    emit({ type: 'step_output', stepId: 'storyboard', data: storyboard });

    // === Step 4: Video Producer ===
    const videos = await runStep('video', state, emit, () =>
      generateVideos(storyboard, scenePrompts, request.format)
    );
    state.videos = videos;
    state.finalVideoUrl = videos[0]?.videoUrl;

    emit({ type: 'step_output', stepId: 'video', data: videos });

    await audioPromise;

    // === Step 6: Viral Optimizer ===
    const viralScore = await runStep('viral', state, emit, () =>
      analyzeViralPotential(script)
    );
    state.viralScore = viralScore;

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
    const improvedScript = await runStep('script', state, emit, () =>
      generateImprovedScript(originalScript, viralScore)
    );
    state.script = improvedScript;

    emit({ type: 'step_output', stepId: 'script', data: improvedScript });

    const audioPromise = startAudioStep(improvedScript, style, improvedScript.fullScript, state, emit);

    // === Step 2: New Scene Prompts ===
    const scenePrompts = await runStep('scenes', state, emit, () =>
      generateScenePrompts(
        improvedScript.scenes,
        style as 'cinematic' | 'energetic' | 'minimal' | 'dramatic' | 'inspirational'
      )
    );
    state.scenePrompts = scenePrompts;

    emit({ type: 'step_output', stepId: 'scenes', data: scenePrompts });

    // === Step 3: Regenerate Storyboard ===
    const storyboard = await runStep('storyboard', state, emit, () =>
      generateStoryboard(scenePrompts, format)
    );
    state.storyboard = storyboard;

    emit({ type: 'step_output', stepId: 'storyboard', data: storyboard });

    // === Step 4: Regenerate Videos ===
    const videos = await runStep('video', state, emit, () =>
      generateVideos(storyboard, scenePrompts, format)
    );
    state.videos = videos;
    state.finalVideoUrl = videos[0]?.videoUrl;

    emit({ type: 'step_output', stepId: 'video', data: videos });

    await audioPromise;

    // === Step 6: Re-analyze Viral Score ===
    const newViralScore = await runStep('viral', state, emit, () =>
      analyzeViralPotential(improvedScript, true)
    );
    state.viralScore = newViralScore;

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
