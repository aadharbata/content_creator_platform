'use client'

import React, { useState, useEffect } from 'react'
import { Search, Star, Play, Image as LucideImage, Code, Book, Video, Headphones, Grid3X3, Heart, Download, TrendingUp, Users, Package, ChevronRight, Filter, SortAsc, Tag, DollarSign, Award, Eye, ShoppingCart, X, Home, User, ShoppingBag, Settings, CreditCard, MessageCircle, LogOut, Moon, Globe, Zap, Camera, Wallet, Building, Plus } from 'lucide-react'

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
  stock?: number
  discount?: number
  tags?: string[]
  featured?: boolean
}

const TYPE_LABELS = {
  image: 'IMAGE',
  video: 'VIDEO',
  course: 'COURSE',
  template: 'TEMPLATE',
  software: 'SOFTWARE',
  ebook: 'EBOOK',
  audio: 'AUDIO',
  physical: 'PHYSICAL',
  other: 'OTHER'
}

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState('')
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
          // Add mock data for demonstration
          const enhancedProducts = data.products.map((product: Product, index: number) => ({
            ...product,
            rating: 0,
            sales: 0,
            reviewCount: 0
          }))
          setProducts(enhancedProducts)
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
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading amazing products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-medium">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-black">FanFeed</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <a href="/feed" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Home className="h-5 w-5" />
            <span className="font-medium">Feed</span>
          </a>
          
          <a href="/creators" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Users className="h-5 w-5" />
            <span className="font-medium">Creators</span>
          </a>
          
          <a href="/store" className="flex items-center space-x-3 px-4 py-3 bg-orange-500 text-white rounded-lg">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">Product Store</span>
          </a>
          
          <a href="/my-products" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
            <span className="font-medium">My Products</span>
          </a>
          
          <a href="/subscriptions" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium">subscriptions</span>
          </a>
          
          <a href="/live-creators" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Users className="h-5 w-5" />
            <span className="font-medium">Live Creators</span>
          </a>
          
          <a href="/chats" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Chats</span>
          </a>
          
          <a href="/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </a>
          
          <a href="/logout" className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </a>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Aadhar Batra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Find creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Moon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Globe className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Store Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Title and Subtitle */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Store</h1>
              <p className="text-xl text-gray-600">Browse and purchase amazing products from creators.</p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/store/${product.id}`}>
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img 
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {TYPE_LABELS[product.type]}
                      </div>
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded">
                        ₹{product.price}
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || `${product.title} - High quality digital product for creators and professionals.`}
                    </p>
                    
                    {/* Creator Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {product.creator.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.creator.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span>★{product.rating}</span>
                          <span>•</span>
                          <span>{product.sales} sales</span>
                        </div>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">No products found</h3>
                <p className="text-gray-600">Try adjusting your search to find what you're looking for</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Utility Bar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-6 space-y-6">
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Zap className="h-5 w-5" />
        </button>
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Camera className="h-5 w-5" />
        </button>
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Wallet className="h-5 w-5" />
        </button>
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Building className="h-5 w-5" />
        </button>
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Book className="h-5 w-5" />
        </button>
        <button className="p-3 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
} 