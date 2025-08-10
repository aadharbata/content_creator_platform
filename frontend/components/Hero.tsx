"use client"

import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface HeroProps {
  language: "en" | "hi"
  translations: any
}

export default function Hero({ language, translations }: HeroProps) {
  const t = translations[language]
  const router = useRouter()

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* New Resources Banner */}
          <div className="inline-flex items-center space-x-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
              {language === 'hi' ? 'नया: 10,000+ प्रीमियम संसाधनों का अन्वेषण करें' : 'New: Explore 10,000+ premium resources'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
            <span className="block">
              {language === 'hi' ? 'दुनिया के सर्वश्रेष्ठ क्रिएटर्स से' : 'Discover & Learn from'}
            </span>
            <span className="block">
              <span className="text-purple-600 dark:text-purple-400">
                {language === 'hi' ? 'दुनिया के' : 'World\'s'}
              </span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}
              </span>{" "}
              <span className="text-teal-600 dark:text-teal-400">
                {language === 'hi' ? 'क्रिएटर्स' : 'Creators'}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {language === 'hi' 
              ? 'दुनिया भर के शीर्ष क्रिएटर्स से प्रीमियम कोर्स, ईबुक, टेम्पलेट और डिजिटल प्रोडक्ट्स तक पहुंचें। आज सीखना शुरू करें।'
              : 'Access premium courses, ebooks, templates, and digital products from top creators worldwide. Start learning today.'
            }
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => router.push('/consumer-channel')}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-8 py-3 text-lg font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            {language === 'hi' ? 'सभी देखें' : 'View All'}
          </Button>
        </div>
      </div>
    </section>
  )
}

