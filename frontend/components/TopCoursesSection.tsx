"use client"

import { Star, Users } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface TopCourses {
  id: string,
  title: string,
  description: string,
  price: number,
  rating: number,
  reviewCount: number,
  salesCount: number,
  duration: number,
  imgURL: string,
  category: string,
  author: {
    id: string,
    name: string,
    avatarUrl: string
  },
  badge?: string | null,
  isFeatured: boolean
}

interface TopCoursesSectionProps {
  language: "en" | "hi"
  translations: any
  topCourses: TopCourses[]
}

export default function TopCoursesSection({ language, translations, topCourses }: TopCoursesSectionProps) {
  const t = translations[language]
  const router = useRouter();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
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
                  <img src={course.imgURL || "/placeholder.svg"} alt={course.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
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
                    {course.category}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-3">{course.author.name}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">₹{course.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>
                      {(course.salesCount ?? 0).toLocaleString()} {t.students}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button onClick={()=>router.push("/viewall")} size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-2 hover:bg-gray-50">
            {t.viewAll} {t.topCourses}
          </Button>
        </div>
      </div>
    </section>
  )
}
