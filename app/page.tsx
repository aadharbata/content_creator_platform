"use client"

import React, { useEffect, useState } from "react"
import Header from "@/frontend/components/Header"
import Hero from "@/frontend/components/Hero"
import SearchSection from "@/frontend/components/SearchSection"
import TopCreatorsSection from "@/frontend/components/TopCreatorsSection"
import TopCoursesSection from "@/frontend/components/TopCoursesSection"
import CreatorCTA from "@/frontend/components/CreatorCTA"
import Footer from "@/frontend/components/Footer"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import TopProductsSection from "@/frontend/components/TopProductsSection"

export default function LandingPage() {
  const { language, setLanguage, translations } = useLanguage()
  const [topCourses, setTopCourses] = useState<any[]>([])

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        const res = await fetch("/api/courses/topcourses")
        if (res.ok) {
          const data = await res.json()
          setTopCourses(data.courses || [])
        } else {
          setTopCourses([])
        }
      } catch {
        setTopCourses([])
      }
    }
    fetchTopCourses()
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <Header language={language} setLanguage={setLanguage} translations={translations} />
      <Hero language={language} translations={translations} />
      <SearchSection language={language} translations={translations} />
      <TopProductsSection />
      <TopCreatorsSection language={language} translations={translations} />
      {topCourses.length > 0 && (
        <TopCoursesSection language={language} translations={translations} topCourses={topCourses as any} />
      )}
      <CreatorCTA language={language} translations={translations} />
      <Footer language={language} translations={translations} />
    </main>
  )
}
