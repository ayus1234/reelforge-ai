/* ============================================
   POST /api/generate — Main Pipeline Endpoint
   Returns SSE stream with real-time progress
   ============================================ */

import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/agents/orchestrator';
import type { GenerationRequest, SSEEvent } from '@/lib/types';

export const maxDuration = 300; // 5 min timeout for long-running generations

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerationRequest;

  // Validate required fields
  if (!body.topic || !body.style || !body.format) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: topic, style, format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await runPipeline(body, emit);
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
