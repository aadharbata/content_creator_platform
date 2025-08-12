"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

interface Creator {
  id: string
  name: string
  handle?: string
  avatar?: string | null
  bio?: string | null
  subscriberCount?: number
  postCount?: number
}

export default function AllCreatorsPage() {
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/creators", { cache: "no-store" })
        const data = await res.json()
        if (res.ok && data?.success) {
          setCreators(data.creators || [])
        } else {
          setCreators([])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return creators
    return creators.filter((c) =>
      (c.name || "").toLowerCase().includes(q) || (c.handle || "").toLowerCase().includes(q)
    )
  }, [creators, query])

  const avatarFor = (c: Creator) =>
    c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "C")}&background=random`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">All Creators</h1>
          <p className="text-gray-600 dark:text-gray-300">Discover creators from our community</p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="relative w-full max-w-lg">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or handle"
              className="h-11"
            />
          </div>
          <Button onClick={() => setQuery("")} variant="outline" className="h-11">Clear</Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No creators found</h3>
            <p className="text-gray-600 dark:text-gray-300">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, index) => (
              <Card
                key={c.id}
                className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/creator/${c.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={avatarFor(c)} alt={c.name} />
                        <AvatarFallback>{(c.name || "C").charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</h3>
                        <Badge className={`${index===0?'bg-yellow-500':index===1?'bg-blue-600':'bg-emerald-600'} text-white`}>{index===0?'Top':index===1?'Popular':'Growing'}</Badge>
                      </div>
                      <div className="text-sm text-gray-500 truncate">{c.handle || `@${(c.name || '').replace(/\s+/g,'')}`}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{c.bio || 'Content creator'}</p>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{c.subscriberCount?.toLocaleString?.() || '—'}</div>
                      <div>Subscribers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{c.postCount?.toLocaleString?.() || 0}</div>
                      <div>Posts</div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <TrendingUp className="w-4 h-4" />
                      Active
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/creator/${c.id}`) }}>View Profile</Button>
                    <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/creator/${c.id}/feed`) }}>View Feed</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 