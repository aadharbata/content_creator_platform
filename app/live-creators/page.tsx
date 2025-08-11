"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Flame, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
}

// Tries a list of sources, falling back to the next if the image fails to load
function ImgWithFallback({ sources, alt, className }: { sources: string[]; alt: string; className?: string }) {
  const [idx, setIdx] = useState(0)
  const src = sources[idx]
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setIdx((i) => (i + 1 < sources.length ? i + 1 : i))} />
  )
}

export default function LiveCreatorsPage() {
  const router = useRouter()
  const [liveCreators, setLiveCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; text: string }>({ open: false, text: '' })

  const showToast = (text: string) => {
    setToast({ open: true, text })
    setTimeout(() => setToast({ open: false, text: '' }), 2000)
  }

  useEffect(() => {
    const fetchLive = async () => {
      try {
        setLoading(true)
        const res = await axios.get('/api/creators/live')
        if (res.data?.success) {
          let list: Creator[] = res.data.creators || []
          let onlyBatra = list.filter((c: Creator) => c.handle?.toLowerCase?.() === 'batraa' || c.name?.toLowerCase?.() === 'batraa')
          onlyBatra = onlyBatra.map(c => ({ ...c, avatar: c.avatar }))
          const demos: Creator[] = [
            { id: 'demo1', name: 'Sana Khan', handle: 'SanaKhan', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop' },
            { id: 'demo2', name: 'Livvy Dunne', handle: 'LivvyDunne', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop' }
          ]
          const first = (onlyBatra.length ? onlyBatra : list.slice(0,1))
          setLiveCreators([ ...first, ...demos ])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchLive()
  }, [])

  const handleWatch = (id: string) => {
    if (id.startsWith('demo')) return
    router.push(`/livestream/${id}`)
  }

  const Banner = ({ localSrc, alt, fallbackSrc }: { localSrc?: string; alt: string; fallbackSrc?: string }) => (
    <div className="w-full h-60 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
      <ImgWithFallback
        alt={alt}
        className="w-full h-full object-cover"
        sources={[...(localSrc ? [localSrc] : []), ...(fallbackSrc ? [fallbackSrc] : []), '/placeholder.jpg']}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Go Back */}
        <div className="mb-6 -ml-2">
          <button onClick={() => router.push('/consumer-channel')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Go Back</span>
          </button>
        </div>

        {/* Live Now heading */}
        <div className="flex items-start sm:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Flame className="text-rose-600" />
              <span>Live Now</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Handpicked creators who are live right this second</p>
          </div>
          <button className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline">Request a Stream</button>
        </div>

        {/* Live grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading live creators...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCreators.map((c, idx) => (
              <Card key={c.id} className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  {/* header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={c.avatar} alt={c.name} />
                          <AvatarFallback className="bg-orange-500 text-white">{c.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600" />
                      </div>
                      <div className="leading-tight">
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          {c.name}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">✔</span>
                        </div>
                        <div className="text-sm text-gray-500">@{c.handle}</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-rose-600 rounded-full px-2.5 py-1">
                      Live
                    </div>
                  </div>

                  {/* banner: try local uploaded image for batraa or fall back to avatar */}
                  <Banner localSrc={c.name.toLowerCase() === 'batraa' || c.handle.toLowerCase() === 'batraa' ? '/uploads/batraa.jpg' : undefined} alt={`${c.name} preview`} fallbackSrc={c.avatar} />

                  {/* footer chips */}
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      {`${(12 - idx).toFixed(1)}K`} watching
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Gaming</span>
                    <span className="text-xs text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Just Chatting</span>
                  </div>

                  {/* CTA */}
                  <Button onClick={() => handleWatch(c.id)} className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl">Watch Live</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-2">
            <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">👥</span>
            Request Livestreams from Your Favorite Creators
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nudge them to go live and choose your topic</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id:'req1', name:'Sana Khan', sources:['/uploads/request1.jpg','/uploads/request1.jpeg','/uploads/request1.png','https://i.postimg.cc/ZY9JS330/closeup-portrait-from-back-pretty-girl-with-attractive-makeup-red-lips-197531-592.png?q=80&w=1200&auto=format&fit=crop'] },
              { id:'req2', name:'Livvy Dunne', sources:['/uploads/request2.jpg','/uploads/request2.jpeg','/uploads/request2.png','https://i.postimg.cc/VN7C0MD2/download-1.png?q=80&w=1200&auto=format&fit=crop'] },
              { id:'req3', name:'Charley Hull', sources:['/uploads/request3.jpg','/uploads/request3.jpeg','/uploads/request3.png','https://i.postimg.cc/cCP7gY4d/download-2.png?q=80&w=1200&auto=format&fit=crop'] }
            ].map((c) => (
              <Card key={c.id} className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="h-48 w-full bg-gray-100 dark:bg-gray-700">
                  <ImgWithFallback sources={c.sources} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>
                  </div>
                  <Button onClick={() => showToast('Your request has been sent')} className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Request</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.open && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg">
            <CheckCircle2 className="text-emerald-400" />
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  )
} 