import { tmpdir } from 'os'
import { mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { moderateImage } from './image'
import { ModerationVerdict } from './types'

/** Extracts one frame per <stepSeconds> seconds and returns file paths */
async function extractFrames(videoPath: string, stepSeconds = 5): Promise<string[]> {
  const dir = await mkdtemp(join(tmpdir(), 'frames-'))
  const pattern = join(dir, 'frame-%04d.jpg')

  await new Promise<void>((resolve, reject) => {
    const ff = spawn(ffmpegPath as string, ['-i', videoPath, '-vf', `fps=1/${stepSeconds}`, pattern])
    ff.on('error', reject)
    ff.on('close', code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))))
  })

  // Collect generated files by numeric sequence until missing
  const frames: string[] = []
  for (let i = 1; ; i++) {
    const file = join(dir, `frame-${i.toString().padStart(4, '0')}.jpg`)
    try {
      // eslint-disable-next-line no-await-in-loop
      await import('fs/promises').then(fs => fs.access(file))
      frames.push(file)
    } catch {
      break
    }
  }
  return frames
}

export async function moderateVideo(videoPath: string): Promise<ModerationVerdict> {
  try {
    const frames = await extractFrames(videoPath)
    const aggregateReasons = new Set<string>()
    for (const frame of frames) {
      // eslint-disable-next-line no-await-in-loop
      const verdict = await moderateImage(frame)
      if (verdict.status === 'REJECTED') {
        verdict.reasons.forEach(r => aggregateReasons.add(r))
        // Early stop if any frame rejected
        return { status: 'REJECTED', reasons: Array.from(aggregateReasons) }
      }
      if (verdict.status === 'REVIEW') {
        verdict.reasons.forEach(r => aggregateReasons.add(r))
      }
    }
    if (aggregateReasons.size > 0) {
      return { status: 'REVIEW', reasons: Array.from(aggregateReasons) }
    }
    return { status: 'OK', reasons: [] }
  } catch (error) {
    return { status: 'REVIEW', reasons: ['VIDEO_MODERATION_FAILED'], raw: (error as Error).message }
  } finally {
    // Cleanup tmp dir asynchronously
    try {
      const dir = join(tmpdir(), 'frames-')
      await rm(dir, { recursive: true, force: true })
    } catch {}
  }
} 