'use client'

import React, { useState } from 'react'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'

interface Post {
  id: string
  creator: {
    name: string
    avatar: string
    headline: string
  }
  time: string
  content: string
  image?: string
  likes: number
  comments: number
}

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    creator: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      headline: 'Digital Artist'
    },
    time: '2h',
    content: 'Just released my new Neon Abstract Patterns pack! Super excited to see what you create with it 🔥',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 89,
    comments: 12
  },
  {
    id: '2',
    creator: {
      name: 'Sarah Williams',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face',
      headline: 'Filmmaker & Vlogger'
    },
    time: '5h',
    content: 'City Skyline 4K timelapse is now live 🌆✨ Check it out and let me know your thoughts!',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 142,
    comments: 34
  },
  {
    id: '3',
    creator: {
      name: 'Mila Rossi',
      avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face',
      headline: 'Music Producer'
    },
    time: '1d',
    content: 'Dropped a chill lo-fi beats pack perfect for relaxing & studying. Give it a listen 🎧',
    image: 'https://images.unsplash.com/photo-1507878866276-a947ef722fee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 245,
    comments: 47
  },
  {
    id: '4',
    creator: {
      name: 'Grace Kim',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face',
      headline: 'Product Designer'
    },
    time: '2d',
    content: 'Working on a minimal desk calendar design for 2026 📅 Here is a sneak peek!',
    image: 'https://images.unsplash.com/photo-1518231782843-287b0d38a07a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 98,
    comments: 19
  },
  {
    id: '5',
    creator: {
      name: 'Daniel Lee',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
      headline: 'Data Scientist'
    },
    time: '3d',
    content: 'My Business Analytics Course hit 1000+ students! 🎉 Thank you for the support.',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    likes: 321,
    comments: 76
  }
]

const FeedPage = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS)

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
                  <p className="font-medium text-white leading-tight">{post.creator.name}</p>
                  <p className="text-sm text-gray-400 leading-tight">{post.creator.headline} • {post.time}</p>
                </div>
              </div>
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </div>

            {/* content */}
            <div className="px-4 pb-4 space-y-4">
              <p className="text-gray-200 whitespace-pre-line">{post.content}</p>
              {post.image && (
                <div className="w-full h-64 bg-black/20 overflow-hidden rounded-lg">
                  <img src={post.image} alt="post" className="w-full h-full object-cover" />
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