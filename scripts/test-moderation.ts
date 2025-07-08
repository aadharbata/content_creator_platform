/*
  Simple CLI test for our moderation utilities.
  Run with:  npx tsx scripts/test-moderation.ts <optional-image-path>
*/

import { moderateText, moderateImage } from '../lib/moderation'

async function run() {
  console.log('--- Text moderation tests ---')

  const samples = [
    'What a lovely day to build software!',
    'You are a fucking idiot',
  ]

  for (const text of samples) {
    const verdict = await moderateText(text)
    console.log(`Text: "${text}" ->`, verdict)
  }

  // Image moderation (only executed if a CLI path is provided)
  const imagePath = process.argv[2]
  if (imagePath) {
    console.log('\n--- Image moderation test ---')
    try {
      const result = await moderateImage(imagePath)
      console.log(`Image (${imagePath}) verdict:`, result)
    } catch (err) {
      console.error('Image moderation failed:', (err as Error).message)
    }
  } else {
    console.log('\nPass an image filepath as argument to test image moderation.')
  }
}

run().catch(err => {
  console.error('Unhandled error in moderation test:', err)
  process.exit(1)
}) 