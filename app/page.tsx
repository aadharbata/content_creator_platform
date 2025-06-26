"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import Header from "@/frontend/components/Header"
import Hero from "@/frontend/components/Hero"
import SearchSection from "@/frontend/components/SearchSection"
import TopCoursesSection from "@/frontend/components/TopCoursesSection"
import TopCreatorsSection from "@/frontend/components/TopCreatorsSection"
import CreatorCTA from "@/frontend/components/CreatorCTA"
import Footer from "@/frontend/components/Footer"
import { translations } from "@/frontend/data/translations"
// import { topCourses } from "@/frontend/data/courses"
import { topCreators } from "@/frontend/data/creators"
import { categories } from "@/frontend/data/categories"
import axios from 'axios';

interface TopCourses {
  id: string,
  title: string,
  author: string,
  price: number,
  rating: number,
  students: number,
  imgUrl: string,
  category: string
}

export default function LandingPage() {
  const { language, setLanguage } = useLanguage();
  const [topCourses, setTopCourses] = useState<TopCourses[]>([]);

  const fetchTopCourses = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/courses/topcourses");
      console.log("Top courses: ", res.data.courses);
      setTopCourses(res.data.courses);
    } catch (error) {
      console.log("Error in fetching top courses: ", error);
      setTopCourses([]);
    }
  }

  useEffect(()=>{
    fetchTopCourses();
  }, []);

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
