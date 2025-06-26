"use client"

import { Upload, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CreatorCTAProps {
  language: "en" | "hi"
  translations: any
}

export default function CreatorCTA({ language, translations }: CreatorCTAProps) {
  const t = translations[language]
  const router = useRouter()

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] opacity-10" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">{t.forCreators}</h2>
          <p className="text-xl lg:text-2xl mb-12 opacity-90">{t.creatorCTA}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === "en" ? "Upload Content" : "कंटेंट अपलोड करें"}</h3>
              <p className="opacity-80">
                {language === "en" ? "Share your knowledge with the world" : "दुनिया के साथ अपना ज्ञान साझा करें"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === "en" ? "Build Audience" : "ऑडियंस बनाएं"}</h3>
              <p className="opacity-80">
                {language === "en" ? "Connect with learners globally" : "दुनियाभर के शिक्षार्थियों से जुड़ें"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === "en" ? "Earn Revenue" : "आय अर्जित करें"}</h3>
              <p className="opacity-80">
                {language === "en" ? "Keep up to 90% of your earnings" : "अपनी कमाई का 90% तक रखें"}
              </p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 text-xl px-12 py-6 h-auto font-bold cursor-pointer"
            onClick={() => router.push('/signup')}
          >
            {t.getStarted}
          </Button>
        </div>
      </div>
    </section>
  )
}
