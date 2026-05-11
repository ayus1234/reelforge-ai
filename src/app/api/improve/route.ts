/* ============================================
   POST /api/improve — Viral Improvement Endpoint
   Triggers the "Make It More Viral" feedback loop
   ============================================ */

import { NextRequest } from 'next/server';
import { runImprovementPipeline } from '@/lib/agents/orchestrator';
import type { SSEEvent, ScriptOutput, ViralScore, ContentFormat } from '@/lib/types';

export const maxDuration = 300;

interface ImproveRequest {
  script: ScriptOutput;
  viralScore: ViralScore;
  format: ContentFormat;
  style: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ImproveRequest;

  if (!body.script || !body.viralScore) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: script, viralScore' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await runImprovementPipeline(
          body.script,
          body.viralScore,
          body.format || '9:16',
          body.style || 'cinematic',
          emit
        );
      } catch (error) {
        emit({
          type: 'pipeline_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
