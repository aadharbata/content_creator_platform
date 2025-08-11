"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, ShoppingCart, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface ProductDetail {
  id: string
  title: string
  description: string
  price: number
  type: string
  thumbnail: string
  images?: string[]
  rating: number
  sales: number
  reviewCount: number
  creator: { id: string; name: string; avatar?: string | null }
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${params.id}`)
        const data = await res.json()
        if (res.ok && data.success) setProduct(data.product)
        else setError(data.error || 'Failed to load product')
      } catch (e) {
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) fetchProduct()
  }, [params?.id])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading product...</p>
      </div>
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4 font-medium">{error || 'Product not found'}</p>
        <button onClick={() => router.push('/products-store')} className="px-4 py-2 bg-gray-900 text-white rounded-lg">Back to store</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => router.push('/products-store')} className="mb-6 inline-flex items-center text-gray-700 hover:text-black">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
            <img src={product.thumbnail} alt={product.title} className="w-full h-[420px] object-cover" />
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 p-4">
                {product.images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt={product.title + i} className="h-20 w-full object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
            <div className="flex items-center space-x-3 mb-4 text-sm">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-gray-600">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">{product.sales} sales</span>
            </div>

            <p className="text-gray-700 leading-7 mb-6 whitespace-pre-wrap">{product.description}</p>

            <div className="flex items-center space-x-4 mb-8">
              <span className="text-3xl font-extrabold text-gray-900">₹{product.price}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{product.type}</span>
            </div>

            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {product.creator.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{product.creator.name}</p>
                <p className="text-sm text-gray-500">Trusted creator</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>

            <div className="flex items-center space-x-4">
              <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 