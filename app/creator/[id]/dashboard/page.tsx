"use client"

import { useState, useEffect, use, useRef } from "react"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import { socketManager } from "@/lib/socket"
import { getAuthToken } from "@/lib/auth"
import { 
  DashboardMessage, 
  DashboardConversation, 
  convertWebSocketToDashboard, 
  isValidMessage 
} from "@/lib/types/shared"
import Link from "next/link"
import { 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MessageCircle, 
  Settings, 
  Upload, 
  Star, 
  Edit3,
  BarChart3,
  Calendar,
  Crown,
  Languages,
  Send,
  Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

// Import professional utilities
import { cn } from "@/lib/utils"
import { getTranslations, type Language } from "@/lib/translations"
import { ApiError, NetworkError, handleApiError } from "@/lib/types/errors"

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
type Message = DashboardMessage

// Professional utility functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num)
}

const formatDate = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || isNaN(minutes) || minutes < 0) {
    return '0m'
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getBadge = (course: Course, t: any) => {
  if (course.salesCount >= COURSE_BADGES.BESTSELLER.threshold) return t.bestseller
  if (course.salesCount >= COURSE_BADGES.POPULAR.threshold) return t.popular
  if (course._count.reviews >= COURSE_BADGES.TOP_RATED.threshold) return t.topRated
  return t.new
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
  } catch (error) {
    return timestamp
  }
}

// Course Card Component
function CourseCard({ course, t }: { course: Course; t: any }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={course.imgURL || getCourseImageFallback(course.category)}
          alt={course.title}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            {getBadge(course, t)}
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
              <span className="font-semibold ml-1">₹{formatNumber(course.price)}</span>
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
                ₹{formatNumber(course.price * course.salesCount)}
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

  // State for real data
  const [creator, setCreator] = useState<Creator | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversationSearch, setConversationSearch] = useState("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Get translations
  const t = translations

  // Fetch all creator data
  useEffect(() => {
    let isMounted = true

    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all data in parallel
        const [creatorResponse, coursesResponse, statsResponse, activityResponse] = await Promise.all([
          fetch(`/api/creator/${id}`),
          fetch(`/api/creator/${id}/courses`),
          fetch(`/api/creator/${id}/stats`),
          fetch(`/api/creator/${id}/activity`)
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
        
        if (!statsResponse.ok) {
          throw new ApiError('Failed to fetch stats', statsResponse.status, `/api/creator/${id}/stats`)
        }
        
        if (!activityResponse.ok) {
          throw new ApiError('Failed to fetch activity', activityResponse.status, `/api/creator/${id}/activity`)
        }

        const [creatorData, coursesData, statsData, activityData] = await Promise.all([
          creatorResponse.json(),
          coursesResponse.json(), 
          statsResponse.json(),
          activityResponse.json()
        ])

        if (isMounted) {
          setCreator(creatorData)
          setCourses(coursesData)
          setStats(statsData)
          setActivities(activityData)
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

  // Initial conversations fetch
  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/creator/${id}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  // Initial messages fetch for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const response = await fetch(`/api/creator/${id}/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        
        // Scroll to bottom
        setTimeout(() => {
          const container = messagesContainerRef.current
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  // Send message via WebSocket
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sendingMessage) return

    try {
      setSendingMessage(true)
      socketManager.sendMessage(selectedConversation.id, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      setSendingMessage(false)
    }
  }

  // WebSocket connection and event handling
  useEffect(() => {
    if (!creator) return

    const token = getAuthToken()
    if (!token) {
      console.error('No authentication token found')
      return
    }

    const socket = socketManager.connect(token)

    // Handle new messages
    socketManager.onNewMessage((messageData) => {
      try {
        // Check if user was at bottom before updating
        const container = messagesContainerRef.current
        const wasAtBottom = container ? 
          Math.abs(container.scrollTop + container.clientHeight - container.scrollHeight) < 50 : true

        // Convert WebSocket message data using shared converter
        const message = convertWebSocketToDashboard.message(messageData)
        
        // Validate the converted message
        if (!isValidMessage(message)) {
          console.error('Invalid message data received:', messageData)
          return
        }

        setMessages(prev => [...prev, message])

        // Only scroll if user was already at bottom
        if (wasAtBottom) {
          setTimeout(() => {
            if (container) {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
              })
            }
          }, 100)
        }
      } catch (error) {
        console.error('Error processing new message:', error, messageData)
      }
    })

    // Handle message sent confirmation
    socketManager.onMessageSent((messageData) => {
      try {
        setSendingMessage(false)
        
        // Optionally add the sent message to the list if not already there
        const message = convertWebSocketToDashboard.message(messageData)
        if (isValidMessage(message)) {
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === message.id)
            return exists ? prev : [...prev, message]
          })
        }
        
        // Scroll to bottom after sending
        setTimeout(() => {
          const container = messagesContainerRef.current
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            })
          }
        }, 100)
      } catch (error) {
        console.error('Error processing message sent confirmation:', error, messageData)
        setSendingMessage(false)
      }
    })

    // Handle conversation updates
    socketManager.onConversationUpdated((updateData) => {
      try {
        const convertedUpdate = convertWebSocketToDashboard.conversationUpdate(updateData)
        
        setConversations(prev => prev.map(conv => 
          conv.id === updateData.conversationId 
            ? { 
                ...conv, 
                ...convertedUpdate
              }
            : conv
        ))
      } catch (error) {
        console.error('Error processing conversation update:', error, updateData)
      }
    })

    // Handle messages read status updates
    socketManager.onMessagesReadUpdate((readUpdate) => {
      try {
        // Update conversation unread count
        setConversations(prev => prev.map(conv => 
          conv.id === readUpdate.conversationId 
            ? { ...conv, unreadCount: readUpdate.unreadCount }
            : conv
        ))
      } catch (error) {
        console.error('Error processing read status update:', error, readUpdate)
      }
    })

    // Handle errors
    socketManager.onError((error) => {
      console.error('Socket error:', error)
      setSendingMessage(false)
    })

    return () => {
      socketManager.removeAllListeners()
    }
  }, [creator])

  // Load conversations when messages tab is active
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchConversations()
    }
  }, [activeTab, id])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      setNewMessage("")
      
      // Join the conversation room (server auto-marks messages as read)
      socketManager.joinConversation(selectedConversation.id)
      
      // Update local unread count immediately since server marks as read
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    }
  }, [selectedConversation, id])

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.fan.name.toLowerCase().includes(conversationSearch.toLowerCase())
  )

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
                    <Avatar className="w-24 h-24 mx-auto ring-4 ring-white shadow-lg">
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
                  
                  <h2 className="text-xl font-bold mb-2">{creator.name}</h2>
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
                    { id: "analytics", icon: TrendingUp, label: t.analytics },
                    { id: "messages", icon: MessageCircle, label: t.messages },
                    { id: "settings", icon: Settings, label: t.settings }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
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
                            {[1,2,3,4,5].map((star) => (
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
                      {courses.slice(0, 3).map((course) => (
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

              <TabsContent value="messages" className="h-full">
                <div className="h-[calc(100vh-200px)] flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
                  {/* Left Panel - Conversations List */}
                  <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                    {/* Header */}
                    <div className="p-4 bg-white h-[73px] flex items-center border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-800">{t.conversations}</h2>
                    </div>
                    
                    {/* Search */}
                    <div className="p-3 bg-white h-[69px] flex items-center border-b border-gray-200">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder={t.searchConversations}
                          value={conversationSearch || ""}
                          onChange={(e) => setConversationSearch(e.target.value || "")}
                          className="pl-9 bg-gray-100 rounded-lg border-gray-200 focus:bg-white focus:border-blue-300 w-full"
                        />
                      </div>
                    </div>
                    
                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto bg-white">
                      {filteredConversations.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm font-medium text-gray-600">{t.noConversations}</p>
                          <p className="text-xs mt-1 text-gray-500">{t.startConversation}</p>
                        </div>
                      ) : (
                        filteredConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            onClick={() => setSelectedConversation(conversation)}
                            className={cn(
                              "p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200",
                              selectedConversation === conversation ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-11 h-11 flex-shrink-0">
                                <AvatarImage src={conversation.fan.avatarUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium">
                                  {conversation.fan.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {conversation.fan.name}
                                  </p>
                                  <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                    {formatMessageTime(conversation.lastMessageAt)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  {conversation.lastMessage && (
                                    <p className="text-sm text-gray-600 truncate">
                                      {conversation.lastMessage.isFromFan ? "" : `${t.you}: `}
                                      {conversation.lastMessage.content}
                                    </p>
                                  )}
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Panel - Chat Area */}
                  <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white h-[73px] flex items-center border-b border-gray-200">
                          {(() => {
                            const conversation = conversations.find(c => c.id === selectedConversation.id)
                            return conversation ? (
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={conversation.fan.avatarUrl || undefined} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium">
                                    {conversation.fan.name.split(" ").map(n => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-900">{conversation.fan.name}</p>
                                </div>
                              </div>
                            ) : null
                          })()}
                        </div>
                        
                        {/* Messages Area */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                          {messagesLoading ? (
                            <div className="h-full flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                              <p className="text-sm text-gray-600 mt-3 font-medium">{t.loadingMessages}</p>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={cn("flex", message.isFromCreator ? "justify-end" : "justify-start")}
                              >
                                <div className={cn("max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm",
                                    message.isFromCreator
                                      ? "bg-blue-500 text-white rounded-br-md"
                                      : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                                  )}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <p className={cn("text-xs mt-2 text-right",
                                      message.isFromCreator ? "text-blue-100" : "text-gray-500"
                                    )}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Message Input */}
                        <div className="p-4 bg-white h-[69px] flex items-center border-t border-gray-200">
                          <div className="flex space-x-3 w-full">
                            <Input
                              key={selectedConversation.id}
                              placeholder={t.typeMessage}
                              value={newMessage || ""}
                              onChange={(e) => setNewMessage(e.target.value || "")}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  sendMessage()
                                }
                              }}
                              disabled={sendingMessage}
                              className="flex-1 bg-gray-100 rounded-full border-gray-200 focus:bg-white focus:border-blue-300 px-4 py-2"
                            />
                            <Button
                              onClick={sendMessage}
                              disabled={!newMessage.trim() || sendingMessage}
                              className="bg-blue-500 hover:bg-blue-600 rounded-full px-4 py-2 shadow-sm"
                            >
                              {sendingMessage ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Empty State Header */}
                        <div className="p-4 bg-white h-[73px] flex items-center border-b border-gray-200">
                          <h2 className="text-xl font-bold text-gray-800">{t.selectConversation}</h2>
                        </div>
                        
                        {/* Empty State Content */}
                        <div className="flex-1 flex items-center justify-center bg-gray-50/30">
                          <div className="text-center text-gray-500">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="font-semibold text-gray-600">{t.selectConversation}</p>
                            <p className="text-sm text-gray-500 mt-1">Choose a conversation to start messaging</p>
                          </div>
                        </div>
                        
                        {/* Empty State Footer */}
                        <div className="p-4 bg-white h-[69px] flex items-center border-t border-gray-200">
                          <div className="flex space-x-3 w-full opacity-50">
                            <Input
                              placeholder={t.typeMessage}
                              disabled
                              className="flex-1 bg-gray-100 rounded-full border-gray-200 px-4 py-2"
                            />
                            <Button
                              disabled
                              className="bg-gray-400 rounded-full px-4 py-2"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="courses">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">{t.courses}</CardTitle>
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
                      {courses.map((course) => (
                        <CourseCard key={course.id} course={course} t={t} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 