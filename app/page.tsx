"use client"

import { useState } from "react"
import Header from "@/frontend/components/Header"
import Hero from "@/frontend/components/Hero"
import SearchSection from "@/frontend/components/SearchSection"
import TopCoursesSection from "@/frontend/components/TopCoursesSection"
import TopCreatorsSection from "@/frontend/components/TopCreatorsSection"
import CreatorCTA from "@/frontend/components/CreatorCTA"
import Footer from "@/frontend/components/Footer"
import { translations } from "@/frontend/data/translations"
import { topCourses } from "@/frontend/data/courses"
import { topCreators } from "@/frontend/data/creators"
import { categories } from "@/frontend/data/categories"

export default function LandingPage() {
  const [language, setLanguage] = useState<"en" | "hi">("en")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header language={language} setLanguage={setLanguage} translations={translations} />
      <Hero language={language} translations={translations} />
      <SearchSection language={language} translations={translations} categories={categories} />
      <TopCoursesSection language={language} translations={translations} topCourses={topCourses} />
      <TopCreatorsSection language={language} translations={translations} topCreators={topCreators} />
      <CreatorCTA language={language} translations={translations} />
      <Footer language={language} />
    </div>
  )
}
