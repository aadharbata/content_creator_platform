export { moderateImage } from './image'
export { moderateText } from './text'
export { moderateVideo } from './video'

import { moderateImage } from './image'
import { moderateText } from './text'
import { moderateVideo } from './video'
import { ModerationVerdict } from './types'

export async function moderate(content: {
  type: 'image' | 'text' | 'video'
  payload: string | Buffer | Uint8Array
}): Promise<ModerationVerdict> {
  switch (content.type) {
    case 'image':
      return moderateImage(content.payload as any)
    case 'text':
      return moderateText(content.payload as string)
    case 'video':
      return moderateVideo(content.payload as string)
    default:
      return { status: 'REVIEW', reasons: ['UNSUPPORTED_TYPE'] }
  }
} 