// Content Delivery System
// Categorizes content based on shareability and delivery method

export type DeliveryMethod = 'APP_ONLY' | 'WHATSAPP' | 'EMAIL' | 'BOTH'

export interface ContentDeliveryConfig {
  type: string
  isHighlyShareable: boolean
  deliveryMethods: DeliveryMethod[]
  maxSizeForDelivery: number // in MB
  supportedFormats: string[]
}

// Content categorization for delivery
export const CONTENT_DELIVERY_CONFIG: Record<string, ContentDeliveryConfig> = {
  // Highly shareable content - APP ONLY
  EBOOK: {
    type: 'EBOOK',
    isHighlyShareable: true,
    deliveryMethods: ['APP_ONLY'],
    maxSizeForDelivery: 0, // No external delivery
    supportedFormats: ['pdf', 'epub']
  },
  TEMPLATE: {
    type: 'TEMPLATE',
    isHighlyShareable: true,
    deliveryMethods: ['APP_ONLY'],
    maxSizeForDelivery: 0,
    supportedFormats: ['figma', 'sketch', 'psd', 'ai', 'canva']
  },
  SOFTWARE: {
    type: 'SOFTWARE',
    isHighlyShareable: true,
    deliveryMethods: ['APP_ONLY'],
    maxSizeForDelivery: 0,
    supportedFormats: ['exe', 'app', 'apk', 'zip']
  },
  COURSE: {
    type: 'COURSE',
    isHighlyShareable: true,
    deliveryMethods: ['APP_ONLY'],
    maxSizeForDelivery: 0,
    supportedFormats: ['mixed']
  },

  // Deliverable content - WhatsApp/Email friendly
  VIDEO: {
    type: 'VIDEO',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 100, // 100MB max
    supportedFormats: ['mp4', 'mov', 'avi', 'mkv']
  },
  AUDIO: {
    type: 'AUDIO',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 50, // 50MB max
    supportedFormats: ['mp3', 'wav', 'aac', 'm4a']
  },
  PODCAST: {
    type: 'PODCAST',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 50,
    supportedFormats: ['mp3', 'wav', 'aac']
  },
  IMAGE: {
    type: 'IMAGE',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 20, // 20MB max
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  ARTICLE: {
    type: 'ARTICLE',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 5, // 5MB max (if has attachments)
    supportedFormats: ['txt', 'doc', 'docx']
  },
  OTHER: {
    type: 'OTHER',
    isHighlyShareable: false,
    deliveryMethods: ['WHATSAPP', 'EMAIL', 'BOTH'],
    maxSizeForDelivery: 25,
    supportedFormats: ['*']
  }
}

// Utility functions
export const isHighlyShareable = (contentType: string): boolean => {
  return CONTENT_DELIVERY_CONFIG[contentType]?.isHighlyShareable || false
}

export const getDeliveryMethods = (contentType: string): DeliveryMethod[] => {
  return CONTENT_DELIVERY_CONFIG[contentType]?.deliveryMethods || ['APP_ONLY']
}

export const canBeDeliveredExternally = (contentType: string): boolean => {
  const methods = getDeliveryMethods(contentType)
  return methods.some(method => method !== 'APP_ONLY')
}

export const getMaxDeliverySize = (contentType: string): number => {
  return CONTENT_DELIVERY_CONFIG[contentType]?.maxSizeForDelivery || 0
}

// OTP generation and validation
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const isValidPhoneNumber = (phone: string): boolean => {
  // Indian phone number validation
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export const formatPhoneNumber = (phone: string): string => {
  // Format to +91XXXXXXXXXX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91${cleaned}`
  }
  return phone
}

// Content delivery message templates
export const DELIVERY_TEMPLATES = {
  whatsapp: {
    welcome: (courseName: string) => 
      `🎉 Welcome to ${courseName}!\n\nYour content is ready for download. Here are your files:`,
    contentItem: (title: string, description: string, downloadLink: string) =>
      `📁 *${title}*\n${description}\n\n🔗 Download: ${downloadLink}`,
    footer: (supportContact: string) =>
      `\n\n💬 Need help? Contact us: ${supportContact}\n\n✨ Enjoy your learning journey!`
  },
  email: {
    subject: (courseName: string) => `Your ${courseName} Content is Ready!`,
    welcome: (courseName: string, userName: string) =>
      `Hi ${userName},\n\nThank you for purchasing ${courseName}! Your content is now ready for download.`,
    contentList: `Here's what you get:`,
    footer: (supportEmail: string) =>
      `\n\nIf you have any questions, feel free to reach out to us at ${supportEmail}.\n\nHappy Learning!\nThe Content Creator Platform Team`
  }
} 