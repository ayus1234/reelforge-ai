'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import IdeaInput from '@/components/IdeaInput';
import AgentPipeline from '@/components/AgentPipeline';
import VideoPreview from '@/components/VideoPreview';
import ReelPlayer from '@/components/ReelPlayer';
import ViralScoreDashboard from '@/components/ViralScoreDashboard';
import type {
  GenerationRequest,
  AgentStep,
  ScriptOutput,
  StoryboardScene,
  VideoScene,
  AudioOutput,
  ViralScore,
  SSEEvent,
  ContentFormat,
} from '@/lib/types';

const INITIAL_STEPS: AgentStep[] = [
  { id: 'script', name: 'Script Writer', icon: '✍️', status: 'waiting', progress: 0, description: 'Crafting viral script with hook, narrative & CTA' },
  { id: 'scenes', name: 'Scene Director', icon: '🎬', status: 'waiting', progress: 0, description: 'Creating cinematic scene prompts' },
  { id: 'storyboard', name: 'Storyboard Generator', icon: '🎨', status: 'waiting', progress: 0, description: 'Generating visual storyboard frames' },
  { id: 'video', name: 'Video Producer', icon: '🎥', status: 'waiting', progress: 0, description: 'Animating scenes into video clips' },
  { id: 'audio', name: 'Audio Producer', icon: '🔊', status: 'waiting', progress: 0, description: 'Creating narration & sound effects' },
  { id: 'viral', name: 'Viral Optimizer', icon: '📈', status: 'waiting', progress: 0, description: 'Analyzing viral potential & scoring' },
];

export default function HomePage() {
  // Pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [pipelineVisible, setPipelineVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generated content
  const [script, setScript] = useState<ScriptOutput | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [videos, setVideos] = useState<VideoScene[]>([]);
  const [audio, setAudio] = useState<AudioOutput | null>(null);
  const [viralScore, setViralScore] = useState<ViralScore | null>(null);
  const [iterationCount, setIterationCount] = useState(0);
  const [exportFormat, setExportFormat] = useState<ContentFormat>('9:16');

  // Preserve request for improvement
  const lastRequestRef = useRef<GenerationRequest | null>(null);

  /**
   * Process SSE stream from the API
   */
  const processSSEStream = useCallback(
    async (response: Response) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const event: SSEEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'step_update':
                if (event.stepId) {
                  setSteps((prev) =>
                    prev.map((s) => {
                      if (s.id !== event.stepId) return s;

                      return {
                        ...s,
                        status: event.status ?? s.status,
                        progress: event.progress ?? s.progress,
                      };
                    })
                  );
                }
                break;

              case 'step_output':
                if (event.stepId === 'script') {
                  setScript(event.data as ScriptOutput);
                } else if (event.stepId === 'storyboard') {
                  setStoryboard(event.data as StoryboardScene[]);
                } else if (event.stepId === 'video') {
                  setVideos(event.data as VideoScene[]);
                } else if (event.stepId === 'audio') {
                  setAudio(event.data as AudioOutput);
                } else if (event.stepId === 'viral') {
                  setViralScore(event.data as ViralScore);
                }
                break;

              case 'pipeline_complete':
                setErrorMessage(null);
                break;

              case 'pipeline_error':
                console.error('Pipeline error:', event.error);
                setErrorMessage(event.error || 'An unknown error occurred');
                // Mark any running step as error
                setSteps((prev) =>
                  prev.map((s) =>
                    s.status === 'running' ? { ...s, status: 'error' as const } : s
                  )
                );
                break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    },
    []
  );

  /**
   * Start the main generation pipeline
   */
  const handleGenerate = useCallback(
    async (request: GenerationRequest) => {
      setIsGenerating(true);
      setPipelineVisible(true);
      setErrorMessage(null);
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'waiting' as const, progress: 0 })));
      setScript(null);
      setStoryboard([]);
      setVideos([]);
      setAudio(null);
      setViralScore(null);
      setIterationCount(0);
      setExportFormat(request.format);
      lastRequestRef.current = request;

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}`);
        }

        await processSSEStream(response);
      } catch (error) {
        console.error('Generation failed:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Generation failed');
        setSteps((prev) =>
          prev.map((s) =>
            s.status === 'running' ? { ...s, status: 'error' as const } : s
          )
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [processSSEStream]
  );

  /**
   * Run the "Make It More Viral" improvement loop
   */
  const handleImprove = useCallback(async () => {
    if (!script || !viralScore || isImproving) return;

    setIsImproving(true);
    setErrorMessage(null);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'waiting' as const, progress: 0 })));

    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          viralScore,
          format: lastRequestRef.current?.format || '9:16' as ContentFormat,
          style: lastRequestRef.current?.style || 'cinematic',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}`);
      }

      await processSSEStream(response);
      setIterationCount((prev) => prev + 1);
    } catch (error) {
      console.error('Improvement failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Improvement failed');
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'running' ? { ...s, status: 'error' as const } : s
        )
      );
    } finally {
      setIsImproving(false);
    }
  }, [script, viralScore, isImproving, processSSEStream]);

  const hasContent = videos.length > 0 || storyboard.length > 0;
  const reelReady = videos.length > 0 && audio !== null;

  return (
    <main className="container">
      <HeroSection />
      <IdeaInput onSubmit={handleGenerate} isGenerating={isGenerating} />

      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-md)',
            }}
            id="error-toast"
          >
            <AlertTriangle
              size={20}
              style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontWeight: 600,
                  color: 'var(--accent-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: 4,
                }}
              >
                Pipeline Error
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AgentPipeline steps={steps} visible={pipelineVisible} />
      <VideoPreview
        videos={videos}
        storyboard={storyboard}
        script={script}
        audio={audio}
        visible={hasContent}
      />
      <ReelPlayer
        videos={videos}
        audio={audio}
        script={script}
        format={exportFormat}
        visible={reelReady}
      />
      <ViralScoreDashboard
        viralScore={viralScore}
        onImprove={handleImprove}
        isImproving={isImproving}
        visible={!!viralScore}
        iterationCount={iterationCount}
      />

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: 'var(--space-2xl) 0',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'var(--space-2xl)',
        }}
      >
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
          }}
        >
          Built with{' '}
          <span className="gradient-text" style={{ fontWeight: 600 }}>
            Runway API
          </span>{' '}
          •{' '}
          <span style={{ fontWeight: 600 }}>
            ElevenLabs
          </span>{' '}
          •{' '}
          <span style={{ fontWeight: 600 }}>
            Next.js
          </span>
        </p>
        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-xs)',
            opacity: 0.6,
          }}
        >
          ReelForge AI — Autonomous AI Creative Studio
        </p>
      </footer>
    </main>
  );
}
