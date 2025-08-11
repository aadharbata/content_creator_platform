"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, Download, Eye, ChevronDown, Tag, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PurchasedProduct {
  id: string
  title: string
  description: string
  price: number
  type: string
  creator: { id: string; name: string; avatar: string; verified?: boolean }
  thumbnail: string
  rating: number
  sales: number
  reviewCount: number
  purchaseDate?: string
  purchaseAmount?: number
}

export default function MyProductsStorePage() {
  const router = useRouter()
  const [products, setProducts] = useState<PurchasedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchMine = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/my-products?page=1&limit=50', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch')
        setProducts(data.products)
      } catch (e: any) {
        setError(e.message || 'Failed to fetch')
      } finally {
        setLoading(false)
      }
    }
    fetchMine()
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (category !== 'all') list = list.filter(p => p.type.toLowerCase() === category)
    // status placeholder: in this mock we only treat all as supported
    if (search.trim()) list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'recent') list = [...list].sort((a, b) => new Date(b.purchaseDate || '').getTime() - new Date(a.purchaseDate || '').getTime())
    if (sortBy === 'price') list = [...list].sort((a, b) => (b.purchaseAmount || b.price) - (a.purchaseAmount || a.price))
    return list
  }, [products, category, status, sortBy, search])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-3 font-medium">{error}</p>
          <button onClick={() => location.reload()} className="px-4 py-2 bg-orange-500 text-white rounded-lg">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 -ml-2">
            <button
              onClick={() => router.push('/consumer-channel')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Go Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">My Products</h1>
              <p className="text-gray-600">Access and manage your purchased digital products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your products..."
                className="pl-10 pr-3 py-2 w-80 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 rounded-lg bg-white border border-gray-200">
            <option value="all">All Categories</option>
            <option value="course">Course</option>
            <option value="software">Software</option>
            <option value="ebook">E-Book</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="template">Template</option>
            <option value="audio">Audio</option>
            <option value="physical">Physical</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-white border border-gray-200">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="expired">Expired</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg bg-white border border-gray-200">
            <option value="recent">Most Recent</option>
            <option value="price">Highest Price</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">{filtered.length} of {products.length} products</div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="relative h-48 bg-gray-100">
              <img src={p.thumbnail || '/placeholder.jpg'} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-500 text-white">{p.type.toUpperCase()}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{p.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(p.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-1">{(p.rating || 0).toFixed(1)} ({p.reviewCount || 0} reviews)</span>
                </div>
                <div className="font-bold text-gray-900">${(p.purchaseAmount || p.price).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">Purchased: {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 