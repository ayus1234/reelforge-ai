'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import type { VideoScene, AudioOutput, ScriptOutput, ContentFormat, ReelExportRequest } from '@/lib/types';

interface ReelPlayerProps {
  videos: VideoScene[];
  audio: AudioOutput | null;
  script: ScriptOutput | null;
  format: ContentFormat;
  visible: boolean;
}

function isVideoClip(scene: VideoScene): boolean {
  return Boolean(scene.videoUrl && scene.videoUrl !== scene.imageUrl);
}

export default function ReelPlayer({ videos, audio, script, format, visible }: ReelPlayerProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const currentSceneIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const total = videos.reduce((sum, v) => sum + v.duration, 0);
    setTotalDuration(total);
    videoRefs.current = videoRefs.current.slice(0, videos.length);
  }, [videos]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getSceneStartTime = useCallback((index: number): number => {
    return videos.slice(0, index).reduce((sum, v) => sum + v.duration, 0);
  }, [videos]);

  const getSceneIndexAtTime = useCallback((time: number): number => {
    if (videos.length === 0) return 0;

    let cursor = 0;
    for (let i = 0; i < videos.length; i++) {
      cursor += videos[i].duration;
      if (time < cursor) return i;
    }

    return videos.length - 1;
  }, [videos]);

  const stopAllMedia = useCallback((resetToStart: boolean) => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      if (resetToStart) video.currentTime = 0;
    });

    if (narrationRef.current) {
      narrationRef.current.pause();
      if (resetToStart) narrationRef.current.currentTime = 0;
    }

    if (sfxRef.current) {
      sfxRef.current.pause();
      if (resetToStart) sfxRef.current.currentTime = 0;
    }
  }, []);

  const syncSceneVideo = useCallback((index: number, time: number, shouldPlay: boolean) => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (i !== index || !videos[i] || !isVideoClip(videos[i])) {
        video.pause();
        return;
      }

      const sceneElapsed = Math.max(0, Math.min(time - getSceneStartTime(i), videos[i].duration));
      video.muted = true;

      if (Math.abs(video.currentTime - sceneElapsed) > 0.35) {
        video.currentTime = sceneElapsed;
      }

      if (shouldPlay && video.paused) {
        video.play().catch(() => {
          // The timeline still advances even if a clip refuses autoplay.
        });
      }
    });
  }, [getSceneStartTime, videos]);

  const resetReel = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSceneIndex(0);
    currentSceneIndexRef.current = 0;
    setProgress(0);
    setElapsed(0);
    elapsedRef.current = 0;
    pausedAtRef.current = 0;
    cancelAnimationFrame(animFrameRef.current);
    stopAllMedia(true);
  }, [stopAllMedia]);

  const finishPlayback = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setProgress(100);
    setElapsed(totalDuration);
    elapsedRef.current = totalDuration;
    pausedAtRef.current = 0;
    cancelAnimationFrame(animFrameRef.current);
    stopAllMedia(false);
  }, [stopAllMedia, totalDuration]);

  const updateTimeline = useCallback(function updateTimeline() {
    if (!isPlayingRef.current || totalDuration <= 0) return;

    const nextElapsed = Math.min((performance.now() - startTimeRef.current) / 1000, totalDuration);
    const nextSceneIndex = getSceneIndexAtTime(nextElapsed);

    elapsedRef.current = nextElapsed;
    setElapsed(nextElapsed);
    setProgress(Math.min((nextElapsed / totalDuration) * 100, 100));

    if (nextSceneIndex !== currentSceneIndexRef.current) {
      currentSceneIndexRef.current = nextSceneIndex;
      setCurrentSceneIndex(nextSceneIndex);
    }

    syncSceneVideo(nextSceneIndex, nextElapsed, true);

    if (nextElapsed >= totalDuration) {
      finishPlayback();
      return;
    }

    animFrameRef.current = requestAnimationFrame(updateTimeline);
  }, [finishPlayback, getSceneIndexAtTime, syncSceneVideo, totalDuration]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (narrationRef.current) narrationRef.current.muted = newMuted;
      if (sfxRef.current) sfxRef.current.muted = newMuted;
      return newMuted;
    });
  }, []);

  const downloadReel = useCallback(async () => {
    if (!script || videos.length === 0) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const payload: ReelExportRequest = {
        videos,
        audio,
        script,
        format,
        includeCaptions: true,
      };

      const response = await fetch('/api/export-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `Export failed with HTTP ${response.status}`;
        try {
          const data = await response.json();
          if (typeof data.error === 'string') message = data.error;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reelforge-reel.mp4';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      console.error('Reel export failed:', err);
      setDownloadError(message);
    } finally {
      setIsDownloading(false);
    }
  }, [audio, format, script, videos]);

  const playReel = useCallback(async () => {
    if (totalDuration <= 0 || videos.length === 0) return;

    const startAt = Math.min(pausedAtRef.current, totalDuration);
    const sceneIndex = getSceneIndexAtTime(startAt);

    setIsPlaying(true);
    isPlayingRef.current = true;
    setDownloadError(null);
    setCurrentSceneIndex(sceneIndex);
    currentSceneIndexRef.current = sceneIndex;
    setElapsed(startAt);
    elapsedRef.current = startAt;
    setProgress((startAt / totalDuration) * 100);

    if (narrationRef.current && audio?.narrationUrl) {
      narrationRef.current.currentTime = startAt;
      narrationRef.current.volume = 0.9;
      narrationRef.current.muted = isMuted;
      narrationRef.current.play().catch(() => {
        // Preview can continue silently if the browser blocks audio playback.
      });
    }

    if (sfxRef.current && audio?.sfxUrl) {
      const sfxDuration = sfxRef.current.duration;
      sfxRef.current.currentTime = Number.isFinite(sfxDuration) && sfxDuration > 0
        ? startAt % sfxDuration
        : startAt;
      sfxRef.current.volume = 0.25;
      sfxRef.current.muted = isMuted;
      sfxRef.current.play().catch(() => {
        // Preview can continue without SFX if the browser blocks it.
      });
    }

    startTimeRef.current = performance.now() - (startAt * 1000);
    syncSceneVideo(sceneIndex, startAt, true);
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateTimeline);
  }, [audio, getSceneIndexAtTime, isMuted, syncSceneVideo, totalDuration, updateTimeline, videos.length]);

  const pauseReel = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    cancelAnimationFrame(animFrameRef.current);
    pausedAtRef.current = Math.min(elapsedRef.current, totalDuration);
    stopAllMedia(false);
  }, [stopAllMedia, totalDuration]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      stopAllMedia(false);
    };
  }, [stopAllMedia]);

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getCaption = useCallback(() => {
    if (!script) return '';
    return script.scenes[currentSceneIndex]?.dialogue || '';
  }, [currentSceneIndex, script]);

  const shouldHide = !visible || videos.length === 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: shouldHide ? 0 : 1, y: shouldHide ? 30 : 0 }}
      className="glass-card"
      style={{
        padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)',
        display: shouldHide ? 'none' : 'block',
      }}
      id="reel-player"
    >
      <h2 style={{
        fontSize: '1.25rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        marginBottom: 'var(--space-lg)',
      }}>
        Final Reel Preview
        <span style={{
          fontSize: '0.75rem', padding: '2px 10px',
          background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)',
          borderRadius: 'var(--radius-full)', fontWeight: 600,
        }}>
          {videos.length} scenes - {totalDuration}s
        </span>
      </h2>

      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: '#000', aspectRatio: '9/16', maxHeight: 500,
        margin: '0 auto', maxWidth: 282,
        border: '2px solid var(--border-medium)',
      }}>
        {videos.map((v, i) => {
          return !isVideoClip(v) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={v.id}
              src={v.imageUrl}
              alt={`Scene ${v.id}`}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: currentSceneIndex === i ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          ) : (
            <video
              key={v.id}
              ref={(el) => { videoRefs.current[i] = el; }}
              src={v.videoUrl}
              playsInline
              muted
              preload="auto"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: currentSceneIndex === i ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          );
        })}

        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-full)', padding: '4px 12px',
          fontSize: '0.7rem', fontWeight: 600, color: '#fff',
          fontFamily: 'var(--font-mono)',
        }}>
          Scene {currentSceneIndex + 1}/{videos.length}
        </div>

        <div style={{
          position: 'absolute', top: 12, left: 12, right: 60,
          display: 'flex', gap: 4,
        }}>
          {videos.map((_, i) => {
            const sceneStart = getSceneStartTime(i);
            const sceneEnd = sceneStart + videos[i].duration;
            const scenePct = elapsed <= sceneStart ? 0 : elapsed >= sceneEnd ? 100
              : ((elapsed - sceneStart) / videos[i].duration) * 100;
            return (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'white',
                  width: `${scenePct}%`,
                  transition: 'width 0.1s linear',
                }} />
              </div>
            );
          })}
        </div>

        {script && (
          <div style={{
            position: 'absolute', bottom: 60, left: 16, right: 16,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            borderRadius: 'var(--radius-md)', padding: '8px 12px',
            fontSize: '0.75rem', color: '#fff', lineHeight: 1.4,
            textAlign: 'center',
          }}>
            {getCaption()}
          </div>
        )}
      </div>

      {audio?.narrationUrl && (
        <audio ref={narrationRef} src={audio.narrationUrl} preload="auto" />
      )}
      {audio?.sfxUrl && (
        <audio ref={sfxRef} src={audio.sfxUrl} preload="auto" loop />
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        marginTop: 'var(--space-lg)', justifyContent: 'center',
      }}>
        <button onClick={resetReel} style={{
          background: 'var(--bg-glass-strong)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)', padding: 8, cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex',
        }}>
          <RotateCcw size={16} />
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? pauseReel : playReel}
          style={{
            background: 'var(--gradient-primary)', border: 'none',
            borderRadius: 'var(--radius-full)', padding: '12px 32px',
            cursor: 'pointer', color: '#fff', fontWeight: 700,
            fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play Reel'}
        </motion.button>

        <button onClick={toggleMute} style={{
          background: 'var(--bg-glass-strong)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)', padding: 8, cursor: 'pointer',
          color: isMuted ? 'var(--accent-secondary)' : 'var(--text-secondary)', display: 'flex',
        }}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        marginTop: 'var(--space-md)',
      }}>
        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: 36 }}>
          {formatTime(elapsed)}
        </span>
        <div className="progress-bar" style={{ flex: 1 }}>
          <motion.div className="fill" style={{ width: `${progress}%`, background: 'var(--gradient-primary)' }} />
        </div>
        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: 36 }}>
          {formatTime(totalDuration)}
        </span>
      </div>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={downloadReel}
          disabled={isDownloading || !script}
          style={{
            background: 'var(--bg-glass-strong)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)', padding: '10px 28px',
            cursor: isDownloading ? 'wait' : 'pointer', color: 'var(--accent-primary-light)',
            fontWeight: 600, fontSize: '0.85rem',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            opacity: isDownloading ? 0.6 : 1,
          }}
        >
          <Download size={16} />
          {isDownloading ? 'Exporting MP4...' : 'Download Reel'}
        </motion.button>
        {downloadError && (
          <p style={{
            fontSize: '0.7rem', color: 'var(--accent-secondary)', marginTop: 6,
          }}>
            {downloadError}
          </p>
        )}
      </div>
    </motion.section>
  );
}
