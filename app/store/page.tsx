'use client'

import React, { useState } from 'react'
import { Search, Star, Play, Image as LucideImage, Code, Book, Video, Headphones, Grid3X3, Heart, Download, TrendingUp, Users, Package } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  type: 'image' | 'video' | 'course' | 'template' | 'software' | 'ebook' | 'audio' | 'physical'
  creator: {
    name: string
    avatar: string
    verified: boolean
  }
  thumbnail: string
  rating: number
  sales: number
}

const DUMMY_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Neon Abstract Patterns',
    price: 299,
    type: 'image',
    creator: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto",
    rating: 4.9,
    sales: 847
  },
  {
    id: '2',
    title: 'City Skyline 4K',
    price: 149,
    type: 'video',
    creator: { name: 'Sarah Williams', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop',
    rating: 4.8,
    sales: 623
  },
  {
    id: '3',
    title: 'Geometric Mandala',
    price: 89,
    type: 'image',
    creator: { name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
    rating: 4.7,
    sales: 1205
  },
  {
    id: '4',
    title: 'Nature Documentary',
    price: 399,
    type: 'video',
    creator: { name: 'Elena Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=300&fit=crop',
    rating: 4.6,
    sales: 432
  },
  {
    id: '5',
    title: 'Ocean Waves 4K',
    price: 199,
    type: 'video',
    creator: { name: 'David Park', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=500&h=300&fit=crop',
    rating: 4.9,
    sales: 289
  },
  {
    id: '6',
    title: 'UI Design Kit',
    price: 79,
    type: 'template',
    creator: { name: 'Lisa Chang', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    sales: 756
  },
  {
    id: '7',
    title: 'Creative T-Shirt',
    price: 499,
    type: 'physical',
    creator: { name: 'Emily Stone', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    sales: 312
  },
  {
    id: '8',
    title: 'Motivational Poster',
    price: 299,
    type: 'physical',
    creator: { name: 'Oliver Reed', avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    sales: 488
  },
  {
    id: '9',
    title: 'Motion Graphics Course',
    price: 299,
    type: 'course',
    creator: { name: 'Jake Miller', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
    rating: 4.9,
    sales: 1234
  },
  {
    id: '10',
    title: 'Sunset Timelapse',
    price: 189,
    type: 'video',
    creator: { name: 'Anna Kim', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop',
    rating: 4.6,
    sales: 445
  },
  {
    id: '11',
    title: 'Minimalist Icons',
    price: 49,
    type: 'template',
    creator: { name: 'Chris Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
    rating: 4.4,
    sales: 223
  },
  {
    id: '12',
    title: 'Space Nebula 8K',
    price: 399,
    type: 'image',
    creator: { name: 'Zoe Chen', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500&h=300&fit=crop',
    rating: 4.8,
    sales: 678
  },
  {
    id: '13',
    title: 'Digital Painting Brush Pack',
    price: 129,
    type: 'template',
    creator: { name: 'Sophia Nguyen', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    sales: 654
  },
  {
    id: '14',
    title: 'Vintage Camera Mockup',
    price: 249,
    type: 'image',
    creator: { name: 'Liam Garcia', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    sales: 412
  },
  {
    id: '15',
    title: 'Mobile UI Kit Dark Mode',
    price: 199,
    type: 'template',
    creator: { name: 'Aria Patel', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1603791452906-86af2ef13775?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    sales: 1032
  },
  {
    id: '16',
    title: 'Inspirational Quote Poster',
    price: 149,
    type: 'physical',
    creator: { name: 'Noah Brooks', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    sales: 210
  },
  {
    id: '17',
    title: 'Ambient Chill Beats',
    price: 99,
    type: 'audio',
    creator: { name: 'Mila Rossi', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    sales: 876
  },
  {
    id: '18',
    title: 'Business Analytics Course',
    price: 499,
    type: 'course',
    creator: { name: 'Daniel Lee', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    sales: 1421
  },
  {
    id: '19',
    title: 'Minimal Desk Calendar',
    price: 199,
    type: 'physical',
    creator: { name: 'Grace Kim', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1518231782843-287b0d38a07a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    sales: 325
  },
  {
    id: '20',
    title: 'AI Startup Pitch Deck',
    price: 299,
    type: 'software',
    creator: { name: 'Ethan Wright', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    sales: 507
  },
  {
    id: '21',
    title: 'Cinematic Drone Footage',
    price: 349,
    type: 'video',
    creator: { name: 'Lucas Silva', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    sales: 640
  },
  {
    id: '22',
    title: 'Creative Writing E-book',
    price: 59,
    type: 'ebook',
    creator: { name: 'Olivia Lopez', avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    sales: 888
  },
  {
    id: '23',
    title: 'Retro Game Sound Pack',
    price: 79,
    type: 'audio',
    creator: { name: 'Henry Adams', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=40&h=40&fit=crop&crop=face', verified: false },
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    sales: 590
  },
  {
    id: '24',
    title: 'Modern Office Icons',
    price: 99,
    type: 'template',
    creator: { name: 'Zara Hassan', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=40&h=40&fit=crop&crop=face', verified: true },
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    sales: 721
  }
]

const TYPE_ICONS = {
  image: LucideImage,
  video: Video,
  course: Play,
  template: Grid3X3,
  software: Code,
  ebook: Book,
  audio: Headphones,
  physical: Package
}

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('top')

  const filteredProducts = DUMMY_PRODUCTS.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || product.type === selectedType
    return matchesSearch && matchesType
  })

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