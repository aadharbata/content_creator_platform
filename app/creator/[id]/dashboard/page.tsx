"use client"

import { useState, useEffect, use, useRef } from "react"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import { useSession, signOut } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import {
  DashboardConversation
} from "@/lib/types/shared"
import Link from "next/link"
import {
  BookOpen,
  TrendingUp,
  DollarSign,
  Users,
  MessageCircle,
  Settings,
  Languages,
  Edit3,
  Upload,
  BarChart3,
  User,
  Star,
  Send,
  Crown,
  Calendar,
  Search,
  LogOut,
  CreditCard,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import { Session } from 'next-auth';
import { useRouter } from "next/navigation";
import axios from "axios";

// Import professional utilities
import { cn } from "@/lib/utils"
import { type Language } from "@/lib/translations"
import { ApiError, NetworkError, handleApiError } from "@/lib/types/errors"
import { SubscriptionManager } from "@/components/SubscriptionManager"


// Professional constants
const COURSE_BADGES = {
  BESTSELLER: { threshold: 100, label: 'bestseller' },
  POPULAR: { threshold: 50, label: 'popular' },
  TOP_RATED: { threshold: 10, label: 'topRated' }
} as const

// Professional interfaces
interface Course {
  id: string
  title: string
  price: number
  rating: number
  imgURL: string
  description: string
  salesCount: number
  createdAt: string
  duration: number
  category: string
  _count: {
    reviews: number
  }
  ContentAnalytics?: {
    views: number
    likes: number
  }[]
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  type: string
  thumbnail: string
  images: string[]
  status: string
  rating: number
  salesCount: number
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    avatar: string | null
  }
  _count: {
    reviews: number
  }
}

interface Post {
  id: string
  title: string
  content: string
  isPaidOnly: boolean
  createdAt: string
  media?: {
    id: string
    url: string
    type: string
  }[]
  likes: {
    id: string
    userId: string
  }[]
  comments: {
    id: string
    content: string
    userId: string
    createdAt: string
    user: {
      id: string
      name: string
      avatarUrl: string | null
    }
  }[]
  _count?: {
    likes: number
    comments: number
  }
  tip?: {
    id: string
    userId: string
    amount: number
    createdAt: string
    user: {
      id: string
      name: string
      avatarUrl: string | null
    }
  }[]
}

interface Creator {
  id: string
  name: string
  email: string
  createdAt: string
  profile?: {
    bio: string | null
    avatarUrl: string | null
    website: string | null
    twitter: string | null
    instagram: string | null
    youtube: string | null
  }
}

interface CreatorStats {
  totalEarnings: number
  totalStudents: number
  totalCourses: number
  averageRating: number
  growth: string
  thisMonth: number
}

interface Activity {
  id: string
  type: string
  message: string
  time: string
  amount?: number
}

// Using shared types for consistency
type Conversation = DashboardConversation

// Professional utility functions
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

const getBadge = (role: string) => {
  switch (role) {
    case 'CREATOR': return 'bg-orange-100 text-orange-800'
    case 'CONSUMER': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Parse multilingual content to get English text
const parseMultilingualContent = (content: string) => {
  try {
    const parsed = JSON.parse(content)
    return parsed.en || content // Return English content or original if not JSON
  } catch {
    return content // Return original content if not valid JSON
  }
}

const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

const getCourseImageFallback = (category: string): string => {
  const categoryImages: Record<string, string> = {
    'Web Development': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop&crop=center',
    'Design': 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop&crop=center',
    'Digital Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center',
    'Programming': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center',
    'Business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
    'default': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center'
  }
  return categoryImages[category] || categoryImages.default
}

const formatMessageTime = (timestamp: string): string => {
  try {
    const messageTime = new Date(timestamp)
    return messageTime.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch { }
  return timestamp
}

// Course Card Component
function CourseCard({ course, t }: { course: Course; t: Record<string, string> }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={course.imgURL || getCourseImageFallback(course.category)}
          alt={course.title}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getCourseImageFallback(course.category);
          }}
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            {getBadge(course.category)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors min-h-[3rem] line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow min-h-[2.5rem]">
          {course.description}
        </p>

        <div className="flex justify-between items-end mt-auto pt-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">{t.price}:</span>
              <span className="font-semibold ml-1">${Math.round(course.price)}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Star className="w-3 h-3 text-yellow-400 fill-current" aria-hidden="true" />
              <span aria-label={`${t.rating}: ${course.rating.toFixed(1)} out of 5`}>
                {course.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div>
              <span className="text-gray-600">{t.students}:</span>
              <span className="font-semibold ml-1">{formatNumber(course.salesCount)}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-600">{t.earnings}:</span>
              <span className="font-semibold text-green-600 ml-1">
                ${Math.round(course.price * course.salesCount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Product Card Component
function ProductCard({ product, t }: { product: Product; t: Record<string, string> }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={product.thumbnail || '/placeholder.jpg'}
          alt={product.title}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {product.type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors min-h-[3rem] line-clamp-2">
          {product.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow min-h-[2.5rem]">
          {product.description}
        </p>

        <div className="flex justify-between items-end mt-auto pt-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">{t.price}:</span>
              <span className="font-semibold ml-1">${Math.round(product.price)}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Star className="w-3 h-3 text-yellow-400 fill-current" aria-hidden="true" />
              <span aria-label={`${t.rating}: ${product.rating.toFixed(1)} out of 5`}>
                {product.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div>
              <span className="text-gray-600">Sales:</span>
              <span className="font-semibold ml-1">{formatNumber(product.salesCount)}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-600">{t.earnings}:</span>
              <span className="font-semibold text-green-600 ml-1">
                ${Math.round(product.price * product.salesCount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CreatorDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language, setLanguage, translations } = useLanguage()
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [goLiveLoading, setGoLiveLoading] = useState(false);
  const creatorId = (session?.user as any)?.id;

  // Redirect if user is trying to access another creator's dashboard
  useEffect(() => {
    if (session?.user) {
      const sessionUserId = (session.user as any)?.id;
      const userRole = (session.user as any)?.role;
      
      // If user is not a creator, redirect to consumer channel
      if (userRole !== 'CREATOR') {
        router.push('/consumer-channel');
        return;
      }
      
      // If user is trying to access another creator's dashboard, redirect to their own
      if (sessionUserId && sessionUserId !== id) {
        console.log('🚫 Unauthorized dashboard access. Redirecting to own dashboard.');
        router.push(`/creator/${sessionUserId}/dashboard`);
        return;
      }
    }
  }, [session, id, router]);

  // Validate UUID
  if (!validateUUID(id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Invalid creator ID</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // State for real data (move all useState calls here, before any conditional logic)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview")
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showComments, setShowComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<{ [key: string]: any[] }>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())


  // Validate UUID
  if (!validateUUID(id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">Invalid creator ID</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Get translations
  const t = translations

  // Handler functions
  const handleProfileClick = () => {
    // Navigate to current creator's profile page
    window.location.href = `/creator/${id}`;
  };

  const handleCreatorClick = (creatorId: string) => {
    // Navigate to another creator's profile page
    window.location.href = `/creator/${creatorId}`;
  };

  const handleGoLive = async () => {
    setGoLiveLoading(true);
    try {
      await axios.post(`/api/creator/${creatorId}/golive`);
      router.push(`/livestream/${creatorId}`);
    } catch (err) {
      // Optionally show error
      setGoLiveLoading(false);
      alert("Failed to go live. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: 'http://localhost:3000',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Edit post functions
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id)
    setEditTitle(parseMultilingualContent(post.title))
    setEditContent(parseMultilingualContent(post.content))
  }

  const handleSaveEdit = async (postId: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (response.ok) {
        // Update the post in local state
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  title: editTitle,
                  content: editContent,
                }
              : post
          )
        )
        setEditingPostId(null)
        setEditTitle("")
        setEditContent("")
        console.log('Post updated successfully')
      } else {
        const errorData = await response.json()
        console.error('Update error response:', errorData)
        alert(`Failed to update post: ${errorData.error || errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditTitle("")
    setEditContent("")
  }

  // Comment functions
  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
        fetchComments(postId)
      }
      return newSet
    })
  }

  const fetchComments = async (postId: string) => {
    if (comments[postId]) return // Already loaded

    setLoadingComments(prev => new Set(prev).add(postId))
    try {
      const response = await fetch(`/api/posts/${postId}/comment`)
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: data.comments || []
        }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      })

      if (response.ok) {
        // Remove the comment from local state
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.filter(comment => comment.id !== commentId) || []
        }))
        
        // Update the post's comment count
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, _count: { ...post._count, comments: Math.max(0, (post._count?.comments || 1) - 1), likes: post._count?.likes || 0 } }
              : post
          )
        )
        
        console.log('Comment deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete comment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  // Delete post function
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      console.log('Attempting to delete post:', postId)
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response ok:', response.ok)

      if (response.ok) {
        // Remove the post from the local state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
        setDeletePostId(null)
        console.log('Post deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Delete error response:', errorData)
        alert(`Failed to delete post: ${errorData.error || errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch all creator data
  useEffect(() => {
    let isMounted = true

    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel with cache busting
        const timestamp = Date.now()
        const [creatorResponse, coursesResponse, postsResponse, statsResponse, activityResponse, productsResponse] = await Promise.all([
          fetch(`/api/creator/${id}?t=${timestamp}`, { credentials: 'include' }),
          fetch(`/api/creator/${id}/courses?t=${timestamp}`, { credentials: 'include' }),
          fetch(`/api/creator/${id}/posts?t=${timestamp}`, { credentials: 'include' }),
          fetch(`/api/creator/${id}/stats?t=${timestamp}`, { credentials: 'include' }),
          fetch(`/api/creator/${id}/activity?t=${timestamp}`, { credentials: 'include' }),
          fetch(`/api/creator/${id}/products?t=${timestamp}`, { credentials: 'include' })
        ])

        // Check if component is still mounted
        if (!isMounted) return

        // Handle different error types
        if (!creatorResponse.ok) {
          if (creatorResponse.status === 404) {
            throw new ApiError('Creator not found', 404, `/api/creator/${id}`)
          }
          throw new ApiError('Failed to fetch creator data', creatorResponse.status, `/api/creator/${id}`)
        }

        if (!coursesResponse.ok) {
          throw new ApiError('Failed to fetch courses', coursesResponse.status, `/api/creator/${id}/courses`)
        }

        if (!postsResponse.ok) {
          throw new ApiError('Failed to fetch posts', postsResponse.status, `/api/creator/${id}/posts`)
        }

        if (!statsResponse.ok) {
          throw new ApiError('Failed to fetch stats', statsResponse.status, `/api/creator/${id}/stats`)
        }

        if (!activityResponse.ok) {
          throw new ApiError('Failed to fetch activity', activityResponse.status, `/api/creator/${id}/activity`)
        }

        if (!productsResponse.ok) {
          throw new ApiError('Failed to fetch products', productsResponse.status, `/api/creator/${id}/products`)
        }

        const [creatorData, coursesData, postsData, statsData, activityData, productsData] = await Promise.all([
          creatorResponse.json(),
          coursesResponse.json(),
          postsResponse.json(),
          statsResponse.json(),
          activityResponse.json(),
          productsResponse.json()
        ])

        if (isMounted) {
          setCreator(creatorData)
          setCourses(coursesData)
          setPosts(postsData.posts || postsData)
          setStats(statsData)
          setActivities(activityData)
          setProducts(productsData.products || productsData)
        }

      } catch (err) {
        if (isMounted) {
          if (err instanceof TypeError && err.message.includes('fetch')) {
            setError(handleApiError(new NetworkError(), ''))
          } else {
            setError(handleApiError(err, `/api/creator/${id}`))
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCreatorData()

    return () => {
      isMounted = false
    }
  }, [id])





  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-lg text-gray-600">{t.loading}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center" role="alert">
          <div className="text-red-500 text-lg mb-4">{t.error}</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t.retry || 'Retry'}
          </Button>
        </div>
      </div>
    )
  }

  // No data state
  if (!creator || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">{t.noData}</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.dashboard}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger className="w-20 bg-white/80 backdrop-blur-sm border-0 shadow-sm" aria-label="Select language">
                  <Languages className="w-4 h-4" aria-hidden="true" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                </SelectContent>
              </Select>

              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link href="/upload">
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t.uploadNew}
                </Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                <Link href={`/creator/${id}/post`}>
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t.uploadContent}
                </Link>
              </Button>
              <Button onClick={handleGoLive} disabled={goLiveLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg">
                {goLiveLoading ? "Going Live..." : "Go Live"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                {/* Profile Section */}
                <div className="text-center mb-6">
                  <div className="relative mb-4">
                    <Avatar
                      className="w-24 h-24 mx-auto ring-4 ring-white shadow-lg cursor-pointer hover:ring-blue-300 transition-all"
                      onClick={handleProfileClick}
                    >
                      <AvatarImage
                        src={creator.profile?.avatarUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`}
                        alt={creator.name}
                      />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-8 h-8 text-yellow-500" aria-hidden="true" />
                    </div>
                  </div>

                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-3">
                    {t.creator || 'Top Creator'}
                  </Badge>

                  <h2
                    className="text-xl font-bold mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={handleProfileClick}
                  >
                    {creator.name}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {creator.profile?.bio || t.contentCreator}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.joined} {formatDate(creator.createdAt)}
                  </p>
                </div>

                {/* Bio Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{t.bio}</h3>
                    <Button variant="ghost" size="sm" aria-label={t.editBio}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {creator.profile?.bio || t.noBioAvailable}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2" role="navigation" aria-label="Dashboard navigation">
                  {[
                    { id: "overview", icon: BarChart3, label: t.overview },
                    { id: "courses", icon: BookOpen, label: t.courses },
                    { id: "posts", icon: Edit3, label: "Posts" },
                    { id: "analytics", icon: TrendingUp, label: t.analytics },
                    { id: "messages", icon: MessageCircle, label: t.messages },
                    { id: "subscription", icon: CreditCard, label: "Manage Subscription" },
                    { id: "profile", icon: User, label: "Profile" },
                    { id: "settings", icon: Settings, label: t.settings },
                    { id: "logout", icon: LogOut, label: "Logout" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'profile') {
                          handleProfileClick();
                        } else if (item.id === 'logout') {
                          handleLogout();
                        } else if (item.id === 'messages') {
                          router.push('/chat-live');
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all",
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                      aria-current={activeTab === item.id ? "page" : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsContent value="overview" className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t.totalEarnings}</p>
                          <p className="text-2xl font-bold text-green-600">₹{formatNumber(stats.totalEarnings)}</p>
                          <p className="text-sm text-green-500">{stats.growth}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t.totalStudents}</p>
                          <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalStudents)}</p>
                          <p className="text-sm text-blue-500">{stats.growth} {t.thisMonth}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t.totalCourses}</p>
                          <p className="text-2xl font-bold text-purple-600">{stats.totalCourses}</p>
                          <p className="text-sm text-purple-500">{Math.round(stats.totalCourses * 0.3)} {t.thisMonth}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-500" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{t.averageRating}</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                          <div className="flex items-center space-x-1" role="img" aria-label={`Average rating: ${stats.averageRating.toFixed(1)} out of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" aria-hidden="true" />
                            ))}
                          </div>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500" aria-hidden="true" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Courses */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {t.topPerforming}
                      </CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/creator/${id}?tab=courses`}>
                          {t.viewAll}
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses
                        .sort((a, b) => (b.price * b.salesCount) - (a.price * a.salesCount))
                        .slice(0, 3)
                        .map((course) => (
                          <CourseCard key={course.id} course={course} t={t} />
                        ))}
                    </div>
                    {courses.length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">{t.noCoursesAvailable}</p>
                        <Button asChild className="mt-4">
                          <Link href="/upload">
                            <Upload className="w-4 h-4 mr-2" />
                            {t.createFirstCourse}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      {t.recentActivity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.length > 0 ? (
                        activities.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/50">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">{activity.message}</p>
                              <p className="text-xs text-gray-500">{formatDate(activity.time)}</p>
                            </div>
                            {activity.amount && (
                              <Badge className="bg-green-100 text-green-800">
                                +₹{formatNumber(activity.amount)}
                              </Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">{t.noRecentActivity}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>



              <TabsContent value="courses">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">Courses & Products</CardTitle>
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Link href="/upload">
                          <Upload className="w-4 h-4 mr-2" />
                          {t.addNew}
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Display Courses (sorted by earnings) */}
                      {courses
                        .sort((a, b) => (b.price * b.salesCount) - (a.price * a.salesCount))
                        .map((course) => (
                          <CourseCard key={course.id} course={course} t={t} />
                        ))}
                      
                      {/* Display Products (sorted by earnings) */}
                      {products
                        .sort((a, b) => (b.price * b.salesCount) - (a.price * a.salesCount))
                        .map((product) => (
                          <ProductCard key={product.id} product={product} t={t} />
                        ))}
                    </div>
                    
                    {courses.length === 0 && products.length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No courses or products available</p>
                        <Button asChild className="mt-4">
                          <Link href="/upload">
                            <Upload className="w-4 h-4 mr-2" />
                            Create your first course or product
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="posts">
                <div className="space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        My Posts
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Create and manage your content posts
                      </p>
                    </div>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white px-6">
                      <Link href={`/creator/${id}/post`}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Post
                      </Link>
                    </Button>
                  </div>

                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Posts</p>
                            <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Likes</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {posts.reduce((total, post) => total + (post._count?.likes || 0), 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Comments</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {posts.reduce((total, post) => total + (post._count?.comments || 0), 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ${posts.reduce((total, post) => total + (post.tip?.reduce((sum, tip) => sum + tip.amount, 0) || 0), 0)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {posts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Edit3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t.noPostsYet}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {t.startCreatingAmazingContent}
                      </p>
                      <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8">
                        <Link href={`/creator/${id}/post`}>
                          <Upload className="w-4 h-4 mr-2" />
                          {t.createYourFirstPost}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {posts.map((post) => (
                        <Card key={post.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                          {/* Image Section */}
                          {post.media && post.media.length > 0 ? (
                            <div className="relative h-48 overflow-hidden">
                              <Image
                                src={post.media[0].url}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                              {/* Badge Overlay */}
                              <div className="absolute top-3 left-3">
                                <Badge className={post.isPaidOnly ? "bg-blue-600 text-white" : "bg-green-600 text-white"}>
                                  {post.isPaidOnly ? "Premium" : "Free"}
                                </Badge>
                              </div>
                              {/* Edit Icon - Right side, next to delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(post);
                                }}
                                className="absolute top-3 right-12 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                                title="Edit post"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {/* Delete Icon - Right side */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                                disabled={isDeleting}
                                className={`absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg ${
                                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Delete post"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Edit3 className="w-12 h-12 text-gray-400" />
                              {/* Badge Overlay */}
                              <div className="absolute top-3 left-3">
                                <Badge className={post.isPaidOnly ? "bg-blue-600 text-white" : "bg-green-600 text-white"}>
                                  {post.isPaidOnly ? "Premium" : "Free"}
                                </Badge>
                              </div>
                              {/* Edit Icon - Right side, next to delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(post);
                                }}
                                className="absolute top-3 right-12 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                                title="Edit post"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {/* Delete Icon - Right side */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                                disabled={isDeleting}
                                className={`absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg ${
                                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Delete post"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                          
                          <CardContent className="p-4">
                            {/* Date */}
                            <p className="text-sm text-gray-500 mb-2">
                              {formatDate(post.createdAt)}
                            </p>
                            
                            {/* Content - Fixed to show proper title and content */}
                            <div className="mb-4">
                              {editingPostId === post.id ? (
                                // Edit mode
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Title
                                    </label>
                                    <input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Enter title..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Content
                                    </label>
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                      placeholder="Enter content..."
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleSaveEdit(post.id)}
                                      disabled={isSaving}
                                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <>
                                  {post.title && (
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                                      {parseMultilingualContent(post.title)}
                                    </h3>
                                  )}
                                  <p className="text-gray-600 text-sm line-clamp-3">
                                    {parseMultilingualContent(post.content)}
                                  </p>
                                </>
                              )}
                            </div>
                            
                            {/* Statistics */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-red-500" />
                                <span className="text-gray-700">{post._count?.likes || 0} Likes</span>
                              </div>
                              <button
                                onClick={() => toggleComments(post.id)}
                                className="flex items-center space-x-1 hover:text-green-600 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <span className="text-gray-700">{post._count?.comments || 0} Comments</span>
                              </button>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4 text-yellow-500" />
                                <span className="text-gray-700">
                                  ${post.tip?.reduce((sum, tip) => sum + tip.amount, 0) || 0} {post.isPaidOnly ? "" : "Free"}
                                </span>
                              </div>
                            </div>

                            {/* Comments Section */}
                            {showComments.has(post.id) && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="space-y-3">
                                  {loadingComments.has(post.id) ? (
                                    <div className="text-center py-4">
                                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                      <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
                                    </div>
                                  ) : comments[post.id] && comments[post.id].length > 0 ? (
                                    comments[post.id].map((comment: any) => (
                                      <div key={comment.id} className="flex space-x-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={comment.user?.profile?.avatarUrl || undefined} />
                                          <AvatarFallback className="text-xs">
                                            {comment.user?.name?.charAt(0) || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="bg-gray-100 rounded-lg px-3 py-2 relative">
                                            <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-900">
                                                  {comment.user?.name || 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-gray-700">
                                                  {comment.content}
                                                </p>
                                              </div>
                                              <button
                                                onClick={() => deleteComment(post.id, comment.id)}
                                                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                title="Delete comment"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-4">
                                      <MessageCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500">No comments yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{t.analytics}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{t.analyticsSoon}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{t.settings}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{t.settingsSoon}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <CreditCard className="w-6 h-6" />
                      {t.manageSubscription}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionManager creatorId={id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 