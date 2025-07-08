import { readFile } from 'fs/promises'
import { ModerationVerdict } from './types'

// ---- AWS Rekognition setup ----
let rekognitionClient: any
let DetectModerationLabelsCommand: any

const hasAwsCreds = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY

async function lazyInitAws() {
  if (!hasAwsCreds) return
  if (!rekognitionClient) {
    const { RekognitionClient, DetectModerationLabelsCommand: Cmd } = await import('@aws-sdk/client-rekognition')
    rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION || 'us-east-1' })
    DetectModerationLabelsCommand = Cmd
  }
}

async function loadImageBytes(input: string | Buffer | Uint8Array): Promise<Uint8Array> {
  if (typeof input === 'string') {
    return new Uint8Array(await readFile(input))
  }
  if (input instanceof Buffer) return new Uint8Array(input)
  return input
}

const DEFAULT_CONFIDENCE = 70

export async function moderateImage(input: string | Buffer | Uint8Array): Promise<ModerationVerdict> {
  if (!hasAwsCreds) {
    return { status: 'REVIEW', reasons: ['REKOGNITION_NOT_CONFIGURED'] }
  }

  try {
    await lazyInitAws()
    const bytes = await loadImageBytes(input)
    const cmd = new DetectModerationLabelsCommand({
      Image: { Bytes: bytes },
      MinConfidence: DEFAULT_CONFIDENCE,
    })
    const resp = await rekognitionClient.send(cmd)

    const labels = resp.ModerationLabels || []
    const reasons = labels.map((l: any) => `${l.Name}`)

    if (reasons.length === 0) {
      return { status: 'OK', reasons: [], raw: resp }
    }
    return { status: 'REJECTED', reasons, raw: resp }
  } catch (error) {
    return { status: 'REVIEW', reasons: ['REKOGNITION_ERROR'], raw: (error as Error).message }
  }
} 