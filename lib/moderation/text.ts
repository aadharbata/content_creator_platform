import Filter from 'bad-words'
import { ModerationVerdict } from './types'

// Bad-words uses a simple blacklist; extend with custom additions if needed
const filter = new Filter({ placeHolder: '*' })

/**
 * Optionally run text through OpenAI Moderation if OPENAI_API_KEY is set.
 */
async function openAiModerate(text: string): Promise<ModerationVerdict | null> {
  if (!process.env.OPENAI_API_KEY) return null
  try {
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.moderations.create({ model: 'text-moderation-latest', input: text })
    const result = resp.results?.[0]
    if (!result) return null
    const flagged = result.flagged || false
    const categories: string[] = Object.entries(result.categories || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k)
    return {
      status: flagged ? 'REJECTED' : 'OK',
      reasons: categories,
      raw: resp,
    }
  } catch (error) {
    return { status: 'REVIEW', reasons: ['OPENAI_ERROR'], raw: (error as Error).message }
  }
}

export async function moderateText(text: string): Promise<ModerationVerdict> {
  // First try OpenAI if available
  const aiVerdict = await openAiModerate(text)
  if (aiVerdict) return aiVerdict

  // Fallback to bad-words
  if (filter.isProfane(text)) {
    const cleaned = filter.clean(text)
    const uniqueWords = [...new Set(cleaned.match(/\*/g))]
    return { status: 'REJECTED', reasons: ['PROFANITY_DETECTED'], raw: { wordCount: uniqueWords.length } }
  }
  return { status: 'OK', reasons: [] }
} 