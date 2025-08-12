"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface ProductCard {
  id: string
  title: string
  description?: string
  price: number
  type: string
  thumbnail?: string | null
  rating: number
  creator: { id: string; name: string; avatar?: string | null }
}

export default function TopProductsSection() {
  const [products, setProducts] = useState<ProductCard[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const params = new URLSearchParams({ page: '1', limit: '3', sortBy: 'sales', sortOrder: 'desc' })
        const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data?.success) {
          setProducts(data.products || [])
        } else {
          setProducts([])
        }
      } catch {
        setProducts([])
      }
    })()
  }, [])

  if (products.length === 0) return null

  const initials = (name?: string) => (name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
            Top Products
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">Most popular products from creators</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <a key={p.id} href={`/products-store/${p.id}`} className="group">
              <Card className="rounded-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="relative h-60 bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbnail || '/placeholder.jpg'} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />
                  <div className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md">
                    {p.type?.toUpperCase?.() || 'PRODUCT'}
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{p.description || ''}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{p.rating?.toFixed?.(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs">
                          {initials(p.creator?.name)}
                        </span>
                        <span className="max-w-[140px] truncate">{p.creator?.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-600 shadow-md">
                        ₹{p.price}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="/products-store" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg">View all products</a>
        </div>
      </div>
    </section>
  )
} 