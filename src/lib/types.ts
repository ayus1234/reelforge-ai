/* ============================================
   ReelForge AI — Type Definitions
   ============================================ */

export type ContentFormat = '9:16' | '16:9';
export type ContentStyle = 'cinematic' | 'energetic' | 'minimal' | 'dramatic' | 'inspirational';
export type AgentStatus = 'waiting' | 'running' | 'complete' | 'error';
export type VoiceGender = 'male' | 'female';

export interface GenerationRequest {
  topic: string;
  style: ContentStyle;
  format: ContentFormat;
  referenceImageUrl?: string;
}

export interface ScriptOutput {
  hook: string;
  narrative: string;
  cta: string;
  fullScript: string;
  scenes: SceneScript[];
  voiceoverText: string;
}

export interface SceneScript {
  id: number;
  description: string;
  dialogue: string;
  duration: number;
  mood: string;
}

export interface ScenePrompt {
  id: number;
  visualPrompt: string;
  cameraAngle: string;
  lighting: string;
  mood: string;
  duration: number;
}

export interface StoryboardScene {
  id: number;
  imageUrl: string;
  prompt: string;
  duration: number;
}

export interface VideoScene {
  id: number;
  videoUrl: string;
  imageUrl: string;
  duration: number;
}

export interface AudioOutput {
  narrationUrl: string;
  sfxUrl: string;
  voicePreset: string;
  voiceGender: VoiceGender;
  voiceReason: string;
  narrationDuration: number;
  rawNarrationUrl?: string;
  totalDuration: number; // final reel duration in seconds (matched to video)
}

export interface ReelExportRequest {
  videos: VideoScene[];
  audio: AudioOutput | null;
  script: ScriptOutput | null;
  format: ContentFormat;
  includeCaptions: boolean;
}

export interface ViralScore {
  total: number;
  hookPower: number;
  visualImpact: number;
  emotionalResonance: number;
  pacingFlow: number;
  suggestions: string[];
  improvedScript?: ScriptOutput;
}

export interface AgentStep {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  description: string;
  output?: unknown;
  startTime?: number;
  endTime?: number;
}

export interface PipelineState {
  sessionId: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  steps: AgentStep[];
  script?: ScriptOutput;
  scenePrompts?: ScenePrompt[];
  storyboard?: StoryboardScene[];
  videos?: VideoScene[];
  audio?: AudioOutput;
  viralScore?: ViralScore;
  finalVideoUrl?: string;
  error?: string;
}

export interface SSEEvent {
  type: 'step_update' | 'step_output' | 'pipeline_complete' | 'pipeline_error';
  stepId?: string;
  status?: AgentStatus;
  data?: unknown;
  error?: string;
}
