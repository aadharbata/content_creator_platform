"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Star, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  title: string
  price: number
  type: 'image' | 'video' | 'course' | 'template' | 'software' | 'ebook' | 'audio' | 'physical' | 'other'
  creator: {
    name: string
    avatar?: string | null
    verified?: boolean
  }
  thumbnail?: string | null
  rating: number
  sales: number
  description?: string
  reviewCount?: number
  stock?: number
  discount?: number
  tags?: string[]
  featured?: boolean
}

const TYPE_LABELS: Record<Product['type'], string> = {
  image: 'IMAGE',
  video: 'VIDEO',
  course: 'COURSE',
  template: 'TEMPLATE',
  software: 'SOFTWARE',
  ebook: 'E-BOOK',
  audio: 'AUDIO',
  physical: 'PHYSICAL',
  other: 'OTHER'
}

const TYPE_DISPLAY_NAMES: Record<Product['type'], string> = {
  image: 'Image',
  video: 'Video',
  course: 'Course',
  template: 'Template',
  software: 'Software',
  ebook: 'E-Book',
  audio: 'Audio',
  physical: 'Physical',
  other: 'Other'
}

export default function ProductsStorePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [minRating, setMinRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const availableTags = useMemo(
    () => [
      'React','JavaScript','Web Development','Productivity','Tools','Workflow',
      'Writing','Creative','Education','Design','UI/UX','Resources','Python','Automation','Scripts','Marketing','Strategy','Business'
    ],
    []
  )

  // Debounce search to avoid spamming API
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchTerm])

  function mapSort(sort: string): { sortBy: 'createdAt' | 'rating' | 'sales' | 'price'; sortOrder: 'asc' | 'desc' } {
    switch (sort) {
      case 'price-low': return { sortBy: 'price', sortOrder: 'asc' }
      case 'price-high': return { sortBy: 'price', sortOrder: 'desc' }
      case 'rating': return { sortBy: 'rating', sortOrder: 'desc' }
      case 'sales': return { sortBy: 'sales', sortOrder: 'desc' }
      case 'newest': return { sortBy: 'createdAt', sortOrder: 'desc' }
      default: return { sortBy: 'sales', sortOrder: 'desc' }
    }
  }

  // Fetch products with cancellation; keep current grid visible by using isFetching
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const fetchProducts = async () => {
      try {
        setError(null)
        if (!bootstrapped) setLoading(true)
        else setIsFetching(true)

        const { sortBy: apiSortBy, sortOrder } = mapSort(sortBy)
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '50')
        params.set('sortBy', apiSortBy)
        params.set('sortOrder', sortOrder)
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (selectedCategory !== 'all') params.set('type', selectedCategory)

        const res = await fetch(`/api/products?${params.toString()}`, { signal, cache: 'no-store' })
        if (!res.ok) {
          let message = 'Failed to fetch products'
          try { const d = await res.json(); message = d.error || message } catch {}
          throw new Error(message)
        }
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch products')

        const enhanced: Product[] = data.products.map((p: any, i: number) => ({
          ...p,
          thumbnail: p.thumbnail || null,
          tags: availableTags.slice(i % 6, (i % 6) + 3),
          featured: i < 1,
          discount: p.discount,
          rating: typeof p.rating === 'number' ? p.rating : 0,
          reviewCount: p.reviewCount || p._count?.reviews || 0,
        }))
        if (!signal.aborted) {
          setProducts(enhanced)
          setBootstrapped(true)
        }
      } catch (e: any) {
        if (signal.aborted) return
        setError(e.message || 'Failed to fetch products')
      } finally {
        if (!signal.aborted) {
          setLoading(false)
          setIsFetching(false)
        }
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [debouncedSearch, selectedCategory, sortBy, availableTags, bootstrapped])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max
      const matchesRating = product.rating >= minRating
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => product.tags?.includes(tag))
      return matchesPrice && matchesRating && matchesTags
    })
  }, [products, priceRange.min, priceRange.max, minRating, selectedTags])

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }, [])

  const markImageFailed = useCallback((id: string) => setFailedImages(prev => {
    if (prev.has(id)) return prev
    const next = new Set(prev)
    next.add(id)
    return next
  }), [])

  const isLikelyValidUrl = (u?: string | null) => !!u && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading products...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4 font-medium">Error: {error}</p>
        <button onClick={() => location.reload()} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Try Again</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 -ml-2">
            <button
              onClick={() => router.push('/consumer-channel')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
              aria-label="Go back to Consumer Channel"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Go Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Product Store</h1>
              <p className="text-gray-600">Discover amazing products from creators worldwide</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="pl-12 pr-4 py-3 w-80 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="sales">Best Selling</option>
            </select>
          </div>
        </div>
      </div>

      {isFetching && (
        <div className="sticky top-[68px] z-30 w-full bg-orange-50 text-orange-700 text-sm py-1 text-center border-b border-orange-100">Updating results…</div>
      )}

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Filters */}
        <aside className="w-80 shrink-0">
          <div className="bg-gray-50 rounded-2xl p-6 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button className="text-orange-500 font-medium" onClick={() => { setSelectedCategory('all'); setPriceRange({min:0,max:1000}); setMinRating(0); setSelectedTags([]); setSearchTerm('') }}>Clear All</button>
            </div>

            {/* Category */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Category</h3>
              <div className="space-y-3">
                {(['course','software','ebook','image','video','template','audio','physical','other'] as const).map((key) => {
                  const count = products.filter(p => p.type === key).length
                  const label = TYPE_DISPLAY_NAMES[key as Product['type']]
                  return (
                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="category" value={key} checked={selectedCategory === key} onChange={(e) => setSelectedCategory(e.target.value)} className="text-orange-500 focus:ring-orange-500" />
                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">{label}</span>
                      </div>
                      <span className="text-sm text-gray-500">({count})</span>
                    </label>
                  )
                })}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="category" value="all" checked={selectedCategory === 'all'} onChange={(e) => setSelectedCategory(e.target.value)} className="text-orange-500 focus:ring-orange-500" />
                    <span className="text-gray-700 group-hover:text-gray-900 font-medium">All</span>
                  </div>
                  <span className="text-sm text-gray-500">({products.length})</span>
                </label>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Price Range</h3>
              <div className="flex items-center gap-2">
                <input type="number" value={priceRange.min} onChange={(e) => setPriceRange(prev => ({...prev, min: parseInt(e.target.value) || 0}))} className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                <span className="text-gray-500">to</span>
                <input type="number" value={priceRange.max} onChange={(e) => setPriceRange(prev => ({...prev, max: parseInt(e.target.value) || 1000}))} className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Minimum Rating</h3>
              <div className="space-y-3">
                {[4,3,2,1,0].map(rating => (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="rating" value={rating} checked={minRating === rating} onChange={(e) => setMinRating(parseInt(e.target.value))} className="text-orange-500 focus:ring-orange-500" />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{rating === 0 ? 'All' : `${rating}+ stars`}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedTags.includes(tag) ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{tag}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6 text-gray-600 font-medium">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const originalPrice = product.discount ? product.price / (1 - product.discount / 100) : product.price
              const src = failedImages.has(product.id)
                ? '/placeholder.jpg'
                : (isLikelyValidUrl(product.thumbnail) ? (product.thumbnail as string) : '/placeholder.jpg')
              return (
                <div key={product.id} className="group cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300" onClick={() => window.location.href = `/products-store/${product.id}`}>
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden bg-gray-50">
                    <img
                      src={src}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      onError={() => markImageFailed(product.id)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      {product.discount && (
                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{product.discount}% OFF</div>
                      )}
                      <div className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">{TYPE_LABELS[product.type]}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description || `${product.title} - High quality digital product.`}</p>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">{product.creator.name?.charAt(0) || 'C'}</div>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">{product.creator.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span>{product.rating.toFixed(1)} ({product.reviewCount || 0} reviews)</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.tags?.slice(0,3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.discount ? (
                          <>
                            <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                            <span className="text-sm text-gray-500 line-through">₹{originalPrice.toFixed(0)}</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                        )}
                      </div>
                      <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl mt-6">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">No products found</h3>
              <p className="text-gray-600 font-medium">Try adjusting your filters to find what you're looking for</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 