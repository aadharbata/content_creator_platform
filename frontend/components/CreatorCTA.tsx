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
    <section className="relative py-20 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500 dark:bg-none dark:bg-gray-900 text-white overflow-hidden">
      {/* subtle glow accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl dark:hidden" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-white/10 blur-3xl dark:hidden" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 drop-shadow-sm">
            {language === 'hi' ? 'बेचना शुरू करने के लिए तैयार हैं?' : 'Ready to Start Selling?'}
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-white/90 dark:text-white/80 mb-12 max-w-2xl mx-auto">
            {language === 'hi' 
              ? 'हजारों क्रिएटर्स में शामिल हों जो अपने जुनून से कमाई कर रहे हैं'
              : 'Join thousands of creators earning from their passion'}
          </p>

          {/* Three Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10 bg-white/25 dark:bg-gray-800 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'कंटेंट अपलोड करें' : 'Upload Content'}
              </h3>
              <p className="text-white/85 dark:text-white/80">
                {language === 'hi' 
                  ? 'दुनिया के साथ अपना ज्ञान साझा करें'
                  : 'Share your knowledge with the world'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10 bg-white/25 dark:bg-gray-800 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'ऑडियंस बनाएं' : 'Build Audience'}
              </h3>
              <p className="text-white/85 dark:text-white/80">
                {language === 'hi' 
                  ? 'विश्व स्तर पर सीखने वालों से जुड़ें'
                  : 'Connect with learners globally'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10 bg-white/25 dark:bg-gray-800 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'राजस्व कमाएं' : 'Earn Revenue'}
              </h3>
              <p className="text-white/85 dark:text-white/80">
                {language === 'hi' 
                  ? 'अपनी कमाई का 90% तक रखें'
                  : 'Keep up to 90% of your earnings'}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => router.push('/signup')}
            className="bg-white text-indigo-700 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 hover:shadow-xl shadow-black/10"
          >
            {language === 'hi' ? 'मुफ्त में शुरू करें' : 'Get Started Free'}
          </Button>
        </div>
      </div>
    </section>
  )
}
