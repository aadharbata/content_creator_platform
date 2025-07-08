/*
  Usage:
    npx tsx scripts/test-video.ts <video-file-path>
*/

import { moderateVideo } from '../lib/moderation'

async function main() {
  const videoPath = process.argv[2]
  if (!videoPath) {
    console.error('❌  Please provide a video file path.')
    console.error('   Example: npx tsx scripts/test-video.ts ./sample.mp4')
    process.exit(1)
  }

  console.log('▶️  Moderating video:', videoPath)
  const verdict = await moderateVideo(videoPath)
  console.log('📝  Verdict:', verdict)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
}) 