'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, MoreHorizontal, Lock } from 'lucide-react'

interface Post {
  id: string
  creator: {
    id: string
    name: string
    handle: string
    avatar: string
  }
  time: string
  content: string
  image?: string
  isPaid?: boolean
  price?: string
  likes: number
  comments: number
  isLiked: boolean
}

const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      // Try to get token from localStorage for authentication
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('/api/posts', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      })
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/creator/${creatorId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center px-4 py-6">
      <h1 className="text-3xl font-bold mb-8 text-white">Creator Feed</h1>

      <div className="w-full max-w-2xl space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-black/40 border border-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
            {/* header */}
            <div className="flex justify-between items-start p-4">
              <div className="flex items-center space-x-4">
                <img src={post.creator.avatar} alt={post.creator.name} className="w-12 h-12 rounded-full" />
                <div>
                  <p 
                    className="font-medium text-white leading-tight hover:text-blue-400 cursor-pointer transition-colors"
                    onClick={() => handleCreatorClick(post.creator.id)}
                  >
                    {post.creator.name}
                  </p>
                  <p className="text-sm text-gray-400 leading-tight">{post.creator.handle} • {new Date(post.time).toLocaleDateString()}</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>

            {/* content */}
            <div className="px-4 pb-4 space-y-4">
              <p className="text-gray-200 whitespace-pre-line">{post.content}</p>
              {post.image && (
                <div className="w-full h-64 bg-black/20 overflow-hidden rounded-lg relative">
                  <img src={post.image} alt="post" className="w-full h-full object-cover" />
                  
                  {/* Paywall Overlay */}
                  {post.isPaid && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-transparent rounded-lg flex flex-col items-center justify-center text-center backdrop-blur-sm">
                      <Lock className="w-12 h-12 text-yellow-400 mb-4" />
                      <div className="text-gray-100 mb-6 text-lg">
                        This post is behind a paywall.
                        <br />
                        <span className="font-bold text-yellow-400">
                          Subscribe to unlock
                        </span>
                      </div>
                      <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                        Subscribe Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="border-t border-white/10 flex items-center justify-around text-gray-400 text-sm">
              <button className="flex items-center space-x-2 py-3 hover:text-white transition-colors w-full justify-center">
                <Heart className="h-4 w-4" />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center space-x-2 py-3 hover:text-white transition-colors w-full justify-center border-l border-white/10">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeedPage 