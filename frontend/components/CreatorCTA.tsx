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
    <section className="py-20 bg-gradient-to-r from-blue-900 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-700 dark:to-pink-700 text-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            {language === 'hi' ? 'बेचना शुरू करने के लिए तैयार हैं?' : 'Ready to Start Selling?'}
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-12 max-w-2xl mx-auto">
            {language === 'hi' 
              ? 'हजारों क्रिएटर्स में शामिल हों जो अपने जुनून से कमाई कर रहे हैं'
              : 'Join thousands of creators earning from their passion'
            }
          </p>

          {/* Three Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'कंटेंट अपलोड करें' : 'Upload Content'}
              </h3>
              <p className="text-blue-100 dark:text-blue-200">
                {language === 'hi' 
                  ? 'दुनिया के साथ अपना ज्ञान साझा करें'
                  : 'Share your knowledge with the world'
                }
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'ऑडियंस बनाएं' : 'Build Audience'}
              </h3>
              <p className="text-blue-100 dark:text-blue-200">
                {language === 'hi' 
                  ? 'विश्व स्तर पर सीखने वालों से जुड़ें'
                  : 'Connect with learners globally'
                }
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {language === 'hi' ? 'राजस्व कमाएं' : 'Earn Revenue'}
              </h3>
              <p className="text-blue-100 dark:text-blue-200">
                {language === 'hi' 
                  ? 'अपनी कमाई का 90% तक रखें'
                  : 'Keep up to 90% of your earnings'
                }
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => router.push('/signup-creator')}
            className="bg-white text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-200 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-xl"
          >
            {language === 'hi' ? 'मुफ्त में शुरू करें' : 'Get Started Free'}
          </Button>
        </div>
      </div>
    </section>
  )
}
