'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, X, Wand2 } from 'lucide-react';
import type { ContentStyle, ContentFormat, GenerationRequest } from '@/lib/types';

interface IdeaInputProps {
  onSubmit: (request: GenerationRequest) => void;
  isGenerating: boolean;
}

const STYLES: { value: ContentStyle; label: string; emoji: string }[] = [
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'minimal', label: 'Minimal', emoji: '✨' },
  { value: 'dramatic', label: 'Dramatic', emoji: '🎭' },
  { value: 'inspirational', label: 'Inspirational', emoji: '🌟' },
];

const FORMATS: { value: ContentFormat; label: string; desc: string }[] = [
  { value: '9:16', label: '9:16', desc: 'TikTok / Reels' },
  { value: '16:9', label: '16:9', desc: 'YouTube' },
];

const EXAMPLE_TOPICS = [
  'Create a motivational reel for students preparing for exams',
  'Startup productivity app launch trailer',
  'Morning routine of a successful entrepreneur',
  'Why most people fail at learning new skills',
];

export default function IdeaInput({ onSubmit, isGenerating }: IdeaInputProps) {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<ContentStyle>('cinematic');
  const [format, setFormat] = useState<ContentFormat>('9:16');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!topic.trim() || isGenerating) return;

      onSubmit({
        topic: topic.trim(),
        style,
        format,
        referenceImageUrl: referenceImage || undefined,
      });
    },
    [topic, style, format, referenceImage, isGenerating, onSubmit]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card"
      style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}
      id="idea-input"
    >
      <form onSubmit={handleSubmit}>
        {/* Topic Input */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            💡 Your Content Idea
          </label>
          <textarea
            className="textarea-field"
            placeholder="Describe the viral reel you want to create..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ minHeight: 100 }}
            id="topic-input"
          />

          {/* Example topics */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-xs)',
              marginTop: 'var(--space-sm)',
            }}
          >
            {EXAMPLE_TOPICS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setTopic(example)}
                style={{
                  padding: '4px 12px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <Wand2 size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                {example.length > 45 ? example.slice(0, 45) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        {/* Style & Format Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {/* Style Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🎨 Style
            </label>
            <div className="chip-group">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`chip ${style === s.value ? 'active' : ''}`}
                  onClick={() => setStyle(s.value)}
                  id={`style-${s.value}`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              📐 Format
            </label>
            <div className="chip-group">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={`chip ${format === f.value ? 'active' : ''}`}
                  onClick={() => setFormat(f.value)}
                  id={`format-${f.value}`}
                >
                  {f.label}
                  <span style={{ opacity: 0.6, marginLeft: 4 }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reference Image Upload */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            📸 Reference Image{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>
              (optional — for style/brand consistency)
            </span>
          </label>

          {referenceImage ? (
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-accent)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={referenceImage}
                alt="Reference"
                style={{
                  maxWidth: 200,
                  maxHeight: 150,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={() => setReferenceImage(null)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              style={{ padding: 'var(--space-lg)' }}
            >
              <Upload size={24} className="drop-icon" style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
              <p className="drop-text">Drag & drop or click to upload</p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          className="btn-primary"
          disabled={!topic.trim() || isGenerating}
          whileHover={{ scale: isGenerating ? 1 : 1.02 }}
          whileTap={{ scale: isGenerating ? 1 : 0.98 }}
          style={{ width: '100%', padding: 'var(--space-md) var(--space-xl)', fontSize: '1.1rem' }}
          id="generate-btn"
        >
          {isGenerating ? (
            <>
              <div className="spinner" />
              Agents Working...
            </>
          ) : (
            <>
              <Send size={18} />
              Generate Viral Reel
            </>
          )}
        </motion.button>
      </form>
    </motion.section>
  );
}
