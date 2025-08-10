"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import Header from "@/frontend/components/Header"
import Hero from "@/frontend/components/Hero"
import SearchSection from "@/frontend/components/SearchSection"
import TopCoursesSection from "@/frontend/components/TopCoursesSection"
import TopCreatorsSection from "@/frontend/components/TopCreatorsSection"
import CreatorCTA from "@/frontend/components/CreatorCTA"
import Footer from "@/frontend/components/Footer"
import { topCreators } from "@/frontend/data/creators"
import { categories } from "@/frontend/data/categories"

export default function HomePage() {
  const { data: session } = useSession()
  const { language, setLanguage, translations: appTranslations } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header 
        language={language} 
        setLanguage={setLanguage} 
        translations={appTranslations} 
      />
      
      <main>
        <Hero language={language} translations={appTranslations} />
        <SearchSection language={language} translations={appTranslations} categories={categories} />
        <TopCoursesSection language={language} translations={appTranslations} topCourses={[]} />
        <TopCreatorsSection 
          language={language} 
          translations={appTranslations}
          topCreators={topCreators}
        />
        <CreatorCTA language={language} translations={appTranslations} />
      </main>
      
      <Footer language={language} translations={appTranslations} />
    </div>
  )
}
