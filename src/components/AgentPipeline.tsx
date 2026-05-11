'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import type { AgentStep, AgentStatus } from '@/lib/types';

interface AgentPipelineProps {
  steps: AgentStep[];
  visible: boolean;
}

function StatusIcon({ status }: { status: AgentStatus }) {
  switch (status) {
    case 'running':
      return <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-primary-light)' }} />;
    case 'complete':
      return <Check size={16} style={{ color: 'var(--accent-success)' }} />;
    case 'error':
      return <AlertCircle size={16} style={{ color: 'var(--accent-secondary)' }} />;
    default:
      return (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid var(--border-medium)',
          }}
        />
      );
  }
}

function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'running': return 'var(--accent-primary)';
    case 'complete': return 'var(--accent-success)';
    case 'error': return 'var(--accent-secondary)';
    default: return 'var(--border-medium)';
  }
}

function getStepProgress(step: AgentStep): number {
  if (step.status === 'complete') return 100;
  if (step.status === 'waiting') return 0;
  return Math.min(Math.max(Math.round(step.progress), 0), 100);
}

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const isActive = step.status === 'running';
  const isComplete = step.status === 'complete';
  const progress = getStepProgress(step);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        background: isActive
          ? 'rgba(124, 58, 237, 0.08)'
          : isComplete
          ? 'rgba(16, 185, 129, 0.05)'
          : 'var(--bg-glass)',
        border: `1px solid ${isActive ? 'var(--border-accent)' : isComplete ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-base)',
        ...(isActive ? { boxShadow: '0 0 20px rgba(124, 58, 237, 0.1)' } : {}),
      }}
    >
      {/* Step Number & Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: isActive
            ? 'rgba(124, 58, 237, 0.15)'
            : isComplete
            ? 'rgba(16, 185, 129, 0.1)'
            : 'var(--bg-glass-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          flexShrink: 0,
        }}
      >
        {step.icon}
      </div>

      {/* Step Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'var(--text-primary)' : isComplete ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {step.name}
          </span>
          <span
            className={`status-badge ${step.status}`}
            style={{ fontSize: '0.65rem' }}
          >
            {step.status === 'running' && 'Processing'}
            {step.status === 'complete' && 'Done'}
            {step.status === 'waiting' && 'Queued'}
            {step.status === 'error' && 'Failed'}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {step.description}
        </p>
        <div
          className="progress-bar"
          style={{
            height: 4,
            marginTop: 'var(--space-xs)',
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <motion.div
            className="fill"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              background: isComplete
                ? 'var(--accent-success)'
                : step.status === 'error'
                ? 'var(--accent-secondary)'
                : 'var(--gradient-primary)',
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div
        style={{
          minWidth: 52,
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: isComplete
            ? 'var(--accent-success)'
            : isActive
            ? 'var(--accent-primary-light)'
            : step.status === 'error'
            ? 'var(--accent-secondary)'
            : 'var(--text-tertiary)',
        }}
      >
        {progress}%
      </div>

      {/* Status Icon */}
      <StatusIcon status={step.status} />
    </motion.div>
  );
}

export default function AgentPipeline({ steps, visible }: AgentPipelineProps) {
  if (!visible) return null;

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalSteps = steps.length;
  const progressPercent = steps.reduce((sum, step) => sum + getStepProgress(step), 0) / totalSteps;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-card"
        style={{
          padding: 'var(--space-xl)',
          marginBottom: 'var(--space-2xl)',
        }}
        id="agent-pipeline"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
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
            🤖 Agent Pipeline
          </h2>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {Math.round(progressPercent)}% complete • {completedCount}/{totalSteps} agents
          </span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar" style={{ marginBottom: 'var(--space-lg)' }}>
          <motion.div
            className="fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ background: 'var(--gradient-primary)' }}
          />
        </div>

        {/* Step Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepCard step={step} index={index} />
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: 16,
                    marginLeft: 35,
                    background:
                      step.status === 'complete'
                        ? getStatusColor('complete')
                        : 'var(--border-subtle)',
                    borderRadius: 1,
                    transition: 'background var(--transition-base)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
