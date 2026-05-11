import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { downloadAsset, probeDuration, runFfmpeg } from '@/lib/server/media-tools';
import type { ContentFormat, ReelExportRequest, VideoScene } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

function getDimensions(format: ContentFormat): { width: number; height: number } {
  return format === '16:9'
    ? { width: 1280, height: 720 }
    : { width: 720, height: 1280 };
}

function isVideoClip(scene: VideoScene): boolean {
  return Boolean(scene.videoUrl && scene.videoUrl !== scene.imageUrl);
}

function fitVideoFilter(width: number, height: number): string {
  return `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=30`;
}

async function createSceneSegment(
  scene: VideoScene,
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  const duration = Math.max(scene.duration || 5, 0.5);
  const baseFilter = fitVideoFilter(width, height);

  if (isVideoClip(scene)) {
    await runFfmpeg([
      '-y',
      '-i', inputPath,
      '-vf', `${baseFilter},trim=duration=${duration},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${duration}`,
      '-t', String(duration),
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      outputPath,
    ], `Scene ${scene.id} video segment`);
    return;
  }

  await runFfmpeg([
    '-y',
    '-loop', '1',
    '-i', inputPath,
    '-vf', baseFilter,
    '-t', String(duration),
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    outputPath,
  ], `Scene ${scene.id} image segment`);
}

function concatListEntry(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");
  return `file '${normalized}'`;
}

async function concatSegments(segmentPaths: string[], listPath: string, outputPath: string): Promise<void> {
  await writeFile(listPath, `${segmentPaths.map(concatListEntry).join('\n')}\n`, 'utf8');
  await runFfmpeg([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outputPath,
  ], 'Video concatenation');
}

function assTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function wrapCaption(text: string, maxChars: number = 38): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      continue;
    }
    line = next;
  }

  if (line) lines.push(line);
  return lines.slice(0, 3).join('\\N');
}

function escapeAssText(text: string): string {
  return wrapCaption(text)
    .replace(/[{}]/g, '')
    .replace(/\r?\n/g, '\\N');
}

async function writeCaptionFile(
  exportRequest: ReelExportRequest,
  filePath: string,
  width: number,
  height: number
): Promise<void> {
  let cursor = 0;
  const fontSize = Math.round(height * 0.034);
  const marginV = Math.round(height * 0.095);

  const events = exportRequest.videos.map((scene, index) => {
    const start = cursor;
    const end = cursor + scene.duration;
    cursor = end;
    const caption = exportRequest.script?.scenes[index]?.dialogue || '';
    return `Dialogue: 0,${assTimestamp(start)},${assTimestamp(end)},Default,,0,0,0,,${escapeAssText(caption)}`;
  });

  const ass = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,Arial,${fontSize},&H00FFFFFF,&H000000FF,&H99000000,&H99000000,0,0,0,0,100,100,0,0,3,2,0,2,48,48,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events,
    '',
  ].join('\n');

  await writeFile(filePath, ass, 'utf8');
}

function escapeFilterPath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'");
}

async function burnCaptions(inputPath: string, assPath: string, outputPath: string): Promise<void> {
  await runFfmpeg([
    '-y',
    '-i', inputPath,
    '-vf', `subtitles='${escapeFilterPath(assPath)}'`,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-an',
    outputPath,
  ], 'Caption burn-in');
}

async function mixAudio(
  videoPath: string,
  narrationPath: string | null,
  sfxPath: string | null,
  duration: number,
  outputPath: string
): Promise<void> {
  if (!narrationPath && !sfxPath) {
    await runFfmpeg([
      '-y',
      '-i', videoPath,
      '-t', String(duration),
      '-c:v', 'copy',
      '-an',
      '-movflags', '+faststart',
      outputPath,
    ], 'Silent reel export');
    return;
  }

  const args = ['-y', '-i', videoPath];
  const filters: string[] = [];
  const labels: string[] = [];
  let inputIndex = 1;

  if (narrationPath) {
    args.push('-i', narrationPath);
    filters.push(`[${inputIndex}:a]atrim=0:${duration},asetpts=PTS-STARTPTS,volume=0.95,aformat=sample_rates=48000:channel_layouts=stereo[narr]`);
    labels.push('[narr]');
    inputIndex += 1;
  }

  if (sfxPath) {
    args.push('-stream_loop', '-1', '-i', sfxPath);
    filters.push(`[${inputIndex}:a]atrim=0:${duration},asetpts=PTS-STARTPTS,volume=0.25,aformat=sample_rates=48000:channel_layouts=stereo[sfx]`);
    labels.push('[sfx]');
  }

  if (labels.length === 1) {
    filters.push(`${labels[0]}anull[aout]`);
  } else {
    filters.push(`${labels.join('')}amix=inputs=${labels.length}:duration=longest:dropout_transition=0[aout]`);
  }

  await runFfmpeg([
    ...args,
    '-filter_complex', filters.join(';'),
    '-map', '0:v:0',
    '-map', '[aout]',
    '-t', String(duration),
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    outputPath,
  ], 'Audio mix');
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReelExportRequest;

  if (!Array.isArray(body.videos) || body.videos.length === 0) {
    return Response.json({ error: 'No video scenes were provided for export' }, { status: 400 });
  }

  if (!body.script) {
    return Response.json({ error: 'No script was provided for caption export' }, { status: 400 });
  }

  const { width, height } = getDimensions(body.format || '9:16');
  const workDir = await mkdtemp(path.join(tmpdir(), 'reelforge-export-'));

  try {
    const segmentPaths: string[] = [];

    for (let i = 0; i < body.videos.length; i++) {
      const scene = body.videos[i];
      const sourceUrl = isVideoClip(scene) ? scene.videoUrl : scene.imageUrl;
      const sourcePath = await downloadAsset(sourceUrl, workDir, `scene-${i + 1}`, isVideoClip(scene) ? '.mp4' : '.jpg');
      const segmentPath = path.join(workDir, `segment-${i + 1}.mp4`);
      await createSceneSegment(scene, sourcePath, segmentPath, width, height);
      segmentPaths.push(segmentPath);
    }

    const concatPath = path.join(workDir, 'concat.mp4');
    await concatSegments(segmentPaths, path.join(workDir, 'segments.txt'), concatPath);

    let videoPath = concatPath;
    if (body.includeCaptions) {
      const assPath = path.join(workDir, 'captions.ass');
      const captionedPath = path.join(workDir, 'captioned.mp4');
      await writeCaptionFile(body, assPath, width, height);
      await burnCaptions(concatPath, assPath, captionedPath);
      videoPath = captionedPath;
    }

    const narrationPath = body.audio?.narrationUrl
      ? await downloadAsset(body.audio.narrationUrl, workDir, 'narration', '.mp3')
      : null;
    const sfxPath = body.audio?.sfxUrl
      ? await downloadAsset(body.audio.sfxUrl, workDir, 'sfx', '.mp3')
      : null;

    const totalDuration = body.videos.reduce((sum, scene) => sum + scene.duration, 0);
    const outputPath = path.join(workDir, 'reelforge-reel.mp4');
    await mixAudio(videoPath, narrationPath, sfxPath, totalDuration, outputPath);

    const duration = await probeDuration(outputPath).catch(() => null);
    if (duration !== null && Math.abs(duration - totalDuration) > 1.5) {
      console.warn(`[Export Reel] Expected ${totalDuration}s, got ${duration.toFixed(2)}s`);
    }

    const output = await readFile(outputPath);
    return new Response(new Uint8Array(output), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="reelforge-reel.mp4"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Export Reel] Failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Reel export failed' },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
