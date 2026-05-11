'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Eye, Heart, Gauge, Lightbulb } from 'lucide-react';
import type { ViralScore } from '@/lib/types';

interface ViralScoreDashboardProps {
  viralScore: ViralScore | null;
  onImprove: () => void;
  isImproving: boolean;
  visible: boolean;
  iterationCount: number;
}

function ScoreRing({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / maxScore) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="score-ring" style={{ margin: '0 auto' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle className="track" cx="90" cy="90" r={radius} />
        <motion.circle
          className="progress"
          cx="90"
          cy="90"
          r={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <div className="score-value">
        <motion.div
          className="number gradient-text"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
        >
          {animatedScore}
        </motion.div>
        <div className="label">Viral Score</div>
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  icon,
  score,
  maxScore = 25,
  color,
  delay,
}: {
  label: string;
  icon: React.ReactNode;
  score: number;
  maxScore?: number;
  color: string;
  delay: number;
}) {
  const percent = (score / maxScore) * 100;

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {icon}
          {label}
        </span>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {score}/{maxScore}
        </span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function ViralScoreDashboard({
  viralScore,
  onImprove,
  isImproving,
  visible,
  iterationCount,
}: ViralScoreDashboardProps) {
  if (!visible || !viralScore) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-2xl)',
      }}
      id="viral-dashboard"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          📈 Viral Analysis
          {iterationCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 10px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-success)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              v{iterationCount + 1} improved
            </span>
          )}
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr',
          gap: 'var(--space-xl)',
          alignItems: 'start',
        }}
      >
        {/* Score Ring */}
        <div style={{ textAlign: 'center' }}>
          <ScoreRing score={viralScore.total} />
        </div>

        {/* Categories */}
        <div>
          <CategoryBar
            label="Hook Power"
            icon={<Eye size={14} />}
            score={viralScore.hookPower}
            color="#7c3aed"
            delay={0.2}
          />
          <CategoryBar
            label="Visual Impact"
            icon={<TrendingUp size={14} />}
            score={viralScore.visualImpact}
            color="#f43f5e"
            delay={0.4}
          />
          <CategoryBar
            label="Emotional Resonance"
            icon={<Heart size={14} />}
            score={viralScore.emotionalResonance}
            color="#06b6d4"
            delay={0.6}
          />
          <CategoryBar
            label="Pacing & Flow"
            icon={<Gauge size={14} />}
            score={viralScore.pacingFlow}
            color="#10b981"
            delay={0.8}
          />
        </div>
      </div>

      {/* Suggestions */}
      <div
        style={{
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg)',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Lightbulb size={14} />
          AI Suggestions
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          {viralScore.suggestions.map((suggestion, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-primary)',
              }}
            >
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Make It More Viral Button */}
      <motion.div
        style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.button
          className="btn-fire"
          onClick={onImprove}
          disabled={isImproving}
          whileHover={{ scale: isImproving ? 1 : 1.05 }}
          whileTap={{ scale: isImproving ? 1 : 0.95 }}
          style={{
            padding: '16px 48px',
            fontSize: '1.15rem',
            borderRadius: 'var(--radius-lg)',
          }}
          id="improve-btn"
        >
          {isImproving ? (
            <>
              <div className="spinner" />
              Improving...
            </>
          ) : (
            <>
              <Flame size={20} />
              Make It More Viral 🔥
            </>
          )}
        </motion.button>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-sm)',
          }}
        >
          AI will rewrite the script, regenerate visuals, and re-optimize for virality
        </p>
      </motion.div>
    </motion.section>
  );
}
