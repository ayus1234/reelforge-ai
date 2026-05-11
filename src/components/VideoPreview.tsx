'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, FileText, Image as ImageIcon } from 'lucide-react';
import type { VideoScene, StoryboardScene, ScriptOutput, AudioOutput } from '@/lib/types';

interface VideoPreviewProps {
  videos: VideoScene[];
  storyboard: StoryboardScene[];
  script: ScriptOutput | null;
  audio: AudioOutput | null;
  visible: boolean;
}

export default function VideoPreview({
  videos,
  storyboard,
  script,
  audio,
  visible,
}: VideoPreviewProps) {
  if (!visible) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-2xl)',
      }}
      id="video-preview"
    >
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
        }}
      >
        🎥 Generated Content
      </h2>

      {/* Main Video */}
      {videos.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Play size={14} /> Video Clips
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {videos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <video
                  src={v.videoUrl}
                  controls
                  playsInline
                  style={{ width: '100%', display: 'block' }}
                  poster={v.imageUrl}
                />
                <div style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Scene {v.id} • {v.duration}s
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Storyboard Grid */}
      {storyboard.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ImageIcon size={14} /> Storyboard
          </h3>
          <div className="scene-grid">
            {storyboard.map((scene, i) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scene.imageUrl}
                  alt={`Scene ${scene.id}`}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div style={{ padding: 'var(--space-sm)' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Scene {scene.id} • {scene.duration}s
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audio && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Volume2 size={14} /> Audio
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                Narration ({audio.voicePreset} - {audio.voiceGender}, {Math.round(audio.narrationDuration)}s)
              </span>
              <audio src={audio.narrationUrl} controls style={{ width: '100%', height: 36 }} />
            </div>
            <div
              style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                🎵 Background SFX
              </span>
              <audio src={audio.sfxUrl} controls style={{ width: '100%', height: 36 }} />
            </div>
          </div>
        </div>
      )}

      {/* Script */}
      {script && (
        <div>
          <h3
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={14} /> Script
          </h3>
          <div
            style={{
              padding: 'var(--space-lg)',
              background: 'var(--bg-glass)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.8,
              color: 'var(--text-secondary)',
            }}
          >
            <p style={{ color: 'var(--accent-primary-light)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              🪝 Hook: &ldquo;{script.hook}&rdquo;
            </p>
            <p style={{ marginBottom: 'var(--space-sm)' }}>{script.narrative}</p>
            <p style={{ color: 'var(--accent-fire)', fontWeight: 600 }}>
              📢 CTA: &ldquo;{script.cta}&rdquo;
            </p>
          </div>
        </div>
      )}
    </motion.section>
  );
}
