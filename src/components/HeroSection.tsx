'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clapperboard, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: 'var(--space-4xl) 0 var(--space-2xl)',
        position: 'relative',
      }}
    >
      {/* Floating orbs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
          filter: 'blur(25px)',
        }}
        animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '40%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          filter: 'blur(22px)',
        }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          background: 'rgba(124, 58, 237, 0.1)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: 'var(--radius-full)',
          marginBottom: 'var(--space-lg)',
          fontSize: '0.85rem',
          color: 'var(--accent-primary-light)',
          fontWeight: 600,
        }}
      >
        <Sparkles size={14} />
        Powered by Runway API — Gen-4 Turbo • ElevenLabs TTS • SFX
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 'var(--space-lg)',
          letterSpacing: '-0.02em',
        }}
      >
        <span className="gradient-text">ReelForge</span>{' '}
        <span style={{ color: 'var(--text-primary)' }}>AI</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
          color: 'var(--text-secondary)',
          maxWidth: 650,
          margin: '0 auto var(--space-xl)',
          lineHeight: 1.6,
        }}
      >
        Autonomous AI Creative Studio — from idea to viral reel in minutes.
        <br />
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.95em' }}>
          Script • Storyboard • Video • Voice • Viral Optimization
        </span>
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: <Clapperboard size={14} />, label: '6 AI Agents' },
          { icon: <Zap size={14} />, label: 'Real-time Pipeline' },
          { icon: <Sparkles size={14} />, label: 'Viral Feedback Loop' },
        ].map((pill) => (
          <div
            key={pill.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              background: 'var(--bg-glass-strong)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            {pill.icon}
            {pill.label}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
