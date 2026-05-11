import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

import ffmpegPath from 'ffmpeg-static';
// @ts-expect-error - no types available
import ffprobeStatic from 'ffprobe-static';

interface ProcessResult {
  stdout: string;
  stderr: string;
}

interface NormalizedAudio {
  url: string;
  duration: number;
  rawDuration: number | null;
}

function getBinaryPath(kind: 'ffmpeg' | 'ffprobe'): string {
  if (kind === 'ffmpeg') {
    return process.env.FFMPEG_BIN || ffmpegPath || 'ffmpeg';
  }

  return process.env.FFPROBE_BIN || ffprobeStatic.path;
}

export function runProcess(binary: string, args: string[], label: string): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}: ${stderr || stdout}`));
    });
  });
}

export function runFfmpeg(args: string[], label: string): Promise<ProcessResult> {
  return runProcess(getBinaryPath('ffmpeg'), args, label);
}

function extensionFromContentType(contentType: string, fallback: string): string {
  if (contentType.includes('video/mp4')) return '.mp4';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/')) return '.jpg';
  if (contentType.includes('audio/wav')) return '.wav';
  if (contentType.includes('audio/mpeg')) return '.mp3';
  if (contentType.includes('audio/')) return '.mp3';
  return fallback;
}

function extensionFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'data:') return null;
    const ext = path.extname(parsed.pathname).toLowerCase();
    return ext || null;
  } catch {
    return null;
  }
}

export async function downloadAsset(
  url: string,
  dir: string,
  name: string,
  fallbackExt: string
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${name}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const ext = extensionFromUrl(url) || extensionFromContentType(contentType, fallbackExt);
  const filePath = path.join(/* turbopackIgnore: true */ dir, `${name}${ext}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(/* turbopackIgnore: true */ filePath, bytes);
  return filePath;
}

export async function probeDuration(filePath: string): Promise<number | null> {
  const result = await runProcess(getBinaryPath('ffprobe'), [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], 'Duration probe');

  const duration = Number.parseFloat(result.stdout.trim());
  return Number.isFinite(duration) ? duration : null;
}

function buildAtempoFilter(tempo: number): string {
  if (!Number.isFinite(tempo) || tempo <= 0) return 'atempo=1';

  const filters: string[] = [];
  let remaining = tempo;

  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }

  while (remaining > 2) {
    filters.push('atempo=2');
    remaining /= 2;
  }

  filters.push(`atempo=${remaining.toFixed(5)}`);
  return filters.join(',');
}

async function fileToDataUrl(filePath: string, contentType: string): Promise<string> {
  const bytes = await readFile(/* turbopackIgnore: true */ filePath);
  return `data:${contentType};base64,${bytes.toString('base64')}`;
}

export async function normalizeAudioToDuration(
  sourceUrl: string,
  targetDuration: number,
  label: string
): Promise<NormalizedAudio> {
  const workDir = await mkdtemp(path.join(/* turbopackIgnore: true */ tmpdir(), 'reelforge-audio-'));

  try {
    const sourcePath = await downloadAsset(sourceUrl, workDir, label, '.mp3');
    const rawDuration = await probeDuration(sourcePath).catch(() => null);
    const tempo = rawDuration ? rawDuration / targetDuration : 1;
    const outputPath = path.join(/* turbopackIgnore: true */ workDir, `${label}-normalized.mp3`);

    await runFfmpeg([
      '-y',
      '-i', sourcePath,
      '-filter:a', `${buildAtempoFilter(tempo)},apad,atrim=0:${targetDuration},asetpts=PTS-STARTPTS`,
      '-t', String(targetDuration),
      '-ac', '2',
      '-ar', '48000',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputPath,
    ], `${label} normalization`);

    const normalizedDuration = await probeDuration(outputPath).catch(() => targetDuration);

    return {
      url: await fileToDataUrl(outputPath, 'audio/mpeg'),
      duration: normalizedDuration || targetDuration,
      rawDuration,
    };
  } finally {
    await rm(/* turbopackIgnore: true */ workDir, { recursive: true, force: true });
  }
}
