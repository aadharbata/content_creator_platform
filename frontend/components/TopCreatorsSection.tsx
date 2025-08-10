"use client"

import { TrendingUp, BookOpen, Star, Award, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopCreatorsSectionProps {
  language: "en" | "hi"
  translations: any
  topCreators: any[]
}

export default function TopCreatorsSection({ language, translations, topCreators }: TopCreatorsSectionProps) {
  // Fallback values for missing translations
  const topCreatorsText = language === 'hi' ? 'शीर्ष क्रिएटर्स' : 'Top Creators'
  const earningsText = language === 'hi' ? 'कमाई' : 'Earnings'
  const studentsText = language === 'hi' ? 'छात्र' : 'Students'
  const coursesText = language === 'hi' ? 'कोर्स' : 'Courses'
  const ratingText = language === 'hi' ? 'रेटिंग' : 'Rating'

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            {topCreatorsText}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {language === "en"
              ? "Learn from industry experts and successful entrepreneurs"
              : "उद्योग के विशेषज्ञों और सफल उद्यमियों से सीखें"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topCreators.map((creator, index) => (
            <Card
              key={creator.id}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-white shadow-lg">
                    <AvatarImage
                      src={creator.avatar || "/placeholder.svg"}
                      alt={language === "en" ? creator.name : creator.nameHi}
                    />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {creator.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2">
                    {index === 0 && <Crown className="w-8 h-8 text-yellow-500" />}
                    {index === 1 && <Award className="w-8 h-8 text-blue-500" />}
                    {index === 2 && <TrendingUp className="w-8 h-8 text-green-500" />}
                  </div>
                </div>

                <Badge
                  className={`mb-4 ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : index === 1
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                        : "bg-gradient-to-r from-green-500 to-emerald-500"
                  } text-white`}
                >
                  {language === "en" ? creator.badge : creator.badgeHi}
                </Badge>

                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors dark:text-white">
                  {language === "en" ? creator.name : creator.nameHi}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "en" ? creator.specialty : creator.specialtyHi}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{creator.earnings}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{earningsText}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{creator.students.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{studentsText}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {creator.courses} {coursesText}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {creator.rating} {ratingText}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center space-x-1 text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>{creator.growth}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
