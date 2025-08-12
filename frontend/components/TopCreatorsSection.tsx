"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Award, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface TopCreatorsSectionProps {
  language: "en" | "hi"
  translations: any
  topCreators?: any[]
}

export default function TopCreatorsSection({ language, translations }: TopCreatorsSectionProps) {
  const router = useRouter()
  const [creators, setCreators] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/creators', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data?.success && Array.isArray(data.creators)) {
          setCreators(data.creators.slice(0, 3))
        } else {
          setCreators([])
        }
      } catch {
        setCreators([])
      }
    })()
  }, [])

  const topCreatorsText = language === 'hi' ? 'शीर्ष क्रिएटर्स' : 'Top Creators'

  const avatarFor = (c: any) => c.avatar || c.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=random`

  return (
    <section className="py-14 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/10 dark:via-teal-900/10 dark:to-cyan-900/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
            {topCreatorsText}
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
            {language === "en"
              ? "Learn from industry experts and successful entrepreneurs"
              : "उद्योग के विशेषज्ञों और सफल उद्यमियों से सीखें"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creators.map((creator, index) => (
            <Card
              key={creator.id}
              className="rounded-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push(`/creator/${creator.id}`)}
            >
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-white shadow-lg">
                    <AvatarImage src={avatarFor(creator)} alt={creator.name} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {(creator.name || '').split(" ").map((n: string) => n[0]).join("")}
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
                  {index === 0 ? 'Top' : index === 1 ? 'Popular' : 'Growing'}
                </Badge>

                <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {creator.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{creator.handle || creator.bio || ''}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{creator.subscriberCount?.toLocaleString?.() || '—'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Subscribers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{(creator.postCount || 0).toLocaleString?.()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Posts</div>
                  </div>
                </div>

                <div className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600">
                  Active
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" className="px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg" onClick={() => router.push('/all-creators')}>View all creators</Button>
        </div>
      </div>
    </section>
  )
}
