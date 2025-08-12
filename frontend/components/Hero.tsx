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
    <section className="relative overflow-hidden pt-16 pb-6 lg:pt-24 lg:pb-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-cyan-900/10">
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
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
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-2 lg:mb-4 max-w-3xl mx-auto leading-relaxed">
            {language === 'hi' 
              ? 'दुनिया भर के शीर्ष क्रिएटर्स से प्रीमियम कोर्स, ईबुक, टेम्पलेट और डिजिटल प्रोडक्ट्स तक पहुंचें। आज सीखना शुरू करें।'
              : 'Access premium courses, ebooks, templates, and digital products from top creators worldwide. Start learning today.'
            }
          </p>
        </div>
      </div>
    </section>
  )
}

