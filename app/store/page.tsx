'use client'

import React, { useState, useEffect } from 'react'
import { Search, Star, Play, Image as LucideImage, Code, Book, Video, Headphones, Grid3X3, Heart, Download, TrendingUp, Users, Package } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  type: 'image' | 'video' | 'course' | 'template' | 'software' | 'ebook' | 'audio' | 'physical' | 'other'
  creator: {
    name: string
    avatar: string
    verified: boolean
  }
  thumbnail: string
  rating: number
  sales: number
  description?: string
  reviewCount?: number
}

const TYPE_ICONS = {
  image: LucideImage,
  video: Video,
  course: Book,
  template: Grid3X3,
  software: Code,
  ebook: Book,
  audio: Headphones,
  physical: Package,
  other: Package
}

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('top')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products?page=1&limit=50')
        const data = await response.json()
        
        if (response.ok && data.success) {
          setProducts(data.products)
        } else {
          setError(data.error || 'Failed to fetch products')
        }
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || product.type === selectedType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <div className="bg-black/40 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">Store</h1>
              <nav className="flex items-center space-x-2 bg-black/40 backdrop-blur-md p-1 rounded-full">
                <button 
                  onClick={() => setActiveTab('top')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'top' ? 'bg-white/90 text-black shadow-sm' : 'text-gray-200 hover:text-white'}`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Top Products</span>
                </button>
                <button 
                  onClick={() => setActiveTab('following')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'following' ? 'bg-white/90 text-black shadow-sm' : 'text-gray-200 hover:text-white'}`}
                >
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                </button>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-full space-x-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search for products"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-2 py-2 w-64 bg-transparent focus:outline-none text-gray-100 placeholder-gray-300"
                  />
                </div>

                {/* Type Selector */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-black/60 py-2 pl-4 pr-8 rounded-full text-sm focus:outline-none shadow-sm text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="course">Courses</option>
                  <option value="template">Templates</option>
                  <option value="software">Software</option>
                  <option value="ebook">E-books</option>
                  <option value="audio">Audio</option>
                  <option value="physical">Physical Products</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Grid Layout - Uniform Heights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const IconComponent = TYPE_ICONS[product.type]
            return (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative bg-black/40 rounded-lg overflow-hidden shadow-lg border border-white/10 backdrop-blur-md transition-shadow duration-200">
                  {/* Image Container - Fixed Height */}
                  <div className="relative h-48 overflow-hidden bg-black/20">
                    <img 
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Type indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-black bg-opacity-60 rounded-full p-1.5">
                        <IconComponent className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    {/* Video play indicator */}
                    {product.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black bg-opacity-60 rounded-full p-3">
                          <Play className="h-5 w-5 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlay Product Info */}
                  <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
                    <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 text-white">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-base line-clamp-1 flex-1 mr-2">{product.title}</h3>
                        <span className="text-sm font-bold text-green-400 whitespace-nowrap">₹{product.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.creator.avatar}
                            alt={product.creator.name}
                            className="w-7 h-7 rounded-full border-2 border-white"
                          />
                          <span className="truncate">{product.creator.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <Star className="h-3 w-3 text-yellow-300 fill-current" />
                          <span>{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-600">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
} 