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
  const t = translations[language]

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t.topCreators}
          </h2>
          <p className="text-xl text-gray-600">
            {language === "en"
              ? "Learn from industry experts and successful entrepreneurs"
              : "उद्योग के विशेषज्ञों और सफल उद्यमियों से सीखें"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topCreators.map((creator, index) => (
            <Card
              key={creator.id}
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm"
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

                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {language === "en" ? creator.name : creator.nameHi}
                </h3>
                <p className="text-gray-600 mb-4">{language === "en" ? creator.specialty : creator.specialtyHi}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{creator.earnings}</div>
                    <div className="text-sm text-gray-600">{t.earnings}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{creator.students.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{t.students}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>
                      {creator.courses} {t.courses}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>
                      {creator.rating} {t.rating}
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
