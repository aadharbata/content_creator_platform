"use client"

import { Star, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

interface TopCoursesSectionProps {
  language: "en" | "hi"
  translations: any
  topCourses: TopCourses[]
}

export default function TopCoursesSection({ language, translations, topCourses }: TopCoursesSectionProps) {
  const t = translations[language]

  return (
    <section className="py-20 relative">
      {/* Curved Belt Design */}
      <div
        className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
        style={{
          borderRadius: "0 0 50% 50% / 0 0 100px 100px",
          transform: "translateY(-50%)",
        }}
      ></div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t.topCourses}
          </h2>
          <p className="text-xl text-gray-600">
            {language === "en"
              ? "Most popular courses chosen by learners worldwide"
              : "दुनियाभर के शिक्षार्थियों द्वारा चुने गए सबसे लोकप्रिय कोर्स"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topCourses.map((course) => (
            <Card
              key={course.id}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  {/* <img
                    src={course.image || "/placeholder.svg"}
                    alt={language === "en" ? course.title : course.titleHi}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  /> */}
                  <img src={course.imgUrl} alt={course.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  {/* <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    {language === "en" ? course.badge : course.badgeHi}
                  </Badge> */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-white text-xs font-medium">{course.rating}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {/* {language === "en" ? course.category : course.categoryHi} */}
                    {course.category}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {/* {language === "en" ? course.title : course.titleHi} */}
                  {course.title}
                </h3>
                {/* <p className="text-gray-600 mb-3">{course.creator}</p> */}
                <p className="text-gray-600 mb-3">{course.author}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">${course.price}</span>
                    {/* <span className="text-gray-400 line-through">${course.originalPrice}</span> */}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {course.students.toLocaleString()} {t.students}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-2 hover:bg-gray-50">
            {t.viewAll} {t.topCourses}
          </Button>
        </div>
      </div>
    </section>
  )
}
