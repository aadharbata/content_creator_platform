"use client"

import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  language: "en" | "hi"
  translations: any
}

export default function Hero({ language, translations }: HeroProps) {
  const t = translations[language]

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200')] opacity-5" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {t.heroTitle}
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t.heroSubtitle}
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed">{t.heroDescription}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              {t.startLearning}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-2 hover:bg-gray-50">
              {t.viewAll}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
