"use client"

import { useState, useEffect, use } from "react"
import { 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MessageCircle, 
  Settings, 
  Upload, 
  Eye, 
  Star, 
  Edit3,
  BarChart3,
  Calendar,
  Award,
  Crown,
  Download,
  Share2,
  Heart,
  Play,
  Languages,
  Search,
  Filter,
  Reply,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ThumbsUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface Course {
  id: string
  title: string
  price: number
  students: number
  rating: number
  imgURL: string
  description: string
  salesCount: number
  createdAt: Date
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
  createdAt: Date
  profile?: {
    bio?: string
    avatarUrl?: string
    twitter?: string
    instagram?: string
    youtube?: string
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

interface Message {
  id: string
  fanId: string
  fanName: string
  fanAvatar: string
  subject: string
  content: string
  timestamp: string | Date
  isRead: boolean
  type: 'question' | 'feedback' | 'support' | 'general'
  courseName?: string
}

export default function CreatorDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [activeTab, setActiveTab] = useState("overview")
  const [creator, setCreator] = useState<Creator | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'question' | 'feedback' | 'support' | 'general'>('all')
  const [messageSearch, setMessageSearch] = useState('')
  const [messagePagination, setMessagePagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to format numbers consistently
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const formatDate = (timestamp: string | Date): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        
        // Fetch creator profile
        const creatorResponse = await fetch(`/api/creator/${id}`)
        if (!creatorResponse.ok) throw new Error('Failed to fetch creator data')
        const creatorData = await creatorResponse.json()
        setCreator(creatorData)

        // Fetch creator courses
        const coursesResponse = await fetch(`/api/creator/${id}/courses`)
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses')
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)

        // Fetch creator stats
        const statsResponse = await fetch(`/api/creator/${id}/stats`)
        if (!statsResponse.ok) throw new Error('Failed to fetch stats')
        const statsData = await statsResponse.json()
        setStats(statsData)

        // Fetch recent activity
        const activityResponse = await fetch(`/api/creator/${id}/activity`)
        if (!activityResponse.ok) throw new Error('Failed to fetch activity')
        const activityData = await activityResponse.json()
        setRecentActivity(activityData)

        // Fetch messages
        const messagesResponse = await fetch(`/api/creator/${id}/messages?type=all&search=&page=1&limit=20`)
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages')
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages)
        setMessagePagination(messagesData.pagination)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCreatorData()
    }
  }, [id])

  // Separate effect to refetch messages when filters change
  useEffect(() => {
    const fetchMessages = async () => {
      if (!id || loading) return
      
      try {
        const params = new URLSearchParams({
          type: messageFilter,
          search: messageSearch,
          page: messagePagination.page.toString(),
          limit: '20'
        })

        const messagesResponse = await fetch(`/api/creator/${id}/messages?${params}`)
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages')
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages)
        setMessagePagination(messagesData.pagination)
      } catch (err) {
        console.error('Error fetching messages:', err)
      }
    }

    fetchMessages()
  }, [messageFilter, messageSearch, messagePagination.page])

  const t = {
    en: {
      dashboard: "Creator Dashboard",
      overview: "Overview",
      courses: "My Courses",
      analytics: "Analytics", 
      messages: "Messages",
      settings: "Settings",
      totalEarnings: "Total Earnings",
      totalStudents: "Total Students",
      totalCourses: "Total Courses",
      averageRating: "Average Rating",
      thisMonth: "This Month",
      growth: "Growth",
      uploadNew: "Upload New Course",
      editProfile: "Edit Profile",
      recentActivity: "Recent Activity",
      topPerforming: "Top Performing Courses",
      quickStats: "Quick Stats",
      viewAll: "View All",
      students: "Students",
      rating: "Rating",
      earnings: "Earnings",
      views: "Views",
      likes: "Likes",
      downloads: "Downloads",
      editBio: "Edit Bio",
      joined: "Joined",
      loading: "Loading...",
      error: "Error loading data",
      noData: "No data available"
    },
    hi: {
      dashboard: "क्रिएटर डैशबोर्ड",
      overview: "अवलोकन",
      courses: "मेरे कोर्स",
      analytics: "विश्लेषण",
      messages: "संदेश",
      settings: "सेटिंग्स",
      totalEarnings: "कुल कमाई",
      totalStudents: "कुल छात्र",
      totalCourses: "कुल कोर्स",
      averageRating: "औसत रेटिंग",
      thisMonth: "इस महीने",
      growth: "वृद्धि",
      uploadNew: "नया कोर्स अपलोड करें",
      editProfile: "प्रोफाइल संपादित करें",
      recentActivity: "हाल की गतिविधि",
      topPerforming: "टॉप परफॉर्मिंग कोर्स",
      quickStats: "त्वरित आंकड़े",
      viewAll: "सभी देखें",
      students: "छात्र",
      rating: "रेटिंग",
      earnings: "कमाई",
      views: "व्यू",
      likes: "लाइक",
      downloads: "डाउनलोड",
      editBio: "बायो संपादित करें",
      joined: "शामिल हुए",
      loading: "लोड हो रहा है...",
      error: "डेटा लोड करने में त्रुटि",
      noData: "कोई डेटा उपलब्ध नहीं"
    }
  }

  const currentLang = t[language]

  // Get unread count from API (will be fetched with messages)
  const unreadCount = messages.filter(m => !m.isRead).length

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/creator/${id}/messages`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          action: 'markAsRead'
        })
      })

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ))
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Get message type icon and color
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="w-4 h-4 text-blue-500" />
      case 'feedback': return <ThumbsUp className="w-4 h-4 text-green-500" />
      case 'support': return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'general': return <MessageCircle className="w-4 h-4 text-purple-500" />
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{currentLang.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{currentLang.error}</div>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!creator || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">{currentLang.noData}</p>
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
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentLang.dashboard}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <Select value={language} onValueChange={(value: "en" | "hi") => setLanguage(value)}>
                <SelectTrigger className="w-20 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                  <Languages className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                </SelectContent>
              </Select>
              
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                {currentLang.uploadNew}
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
                      <AvatarImage src={creator.profile?.avatarUrl || "/placeholder.svg"} alt={creator.name} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-3">
                    Top Creator
                  </Badge>
                  
                  <h2 className="text-xl font-bold mb-2">{creator.name}</h2>
                  <p className="text-gray-600 mb-2">
                    {creator.profile?.bio || "Content Creator"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentLang.joined} {new Date(creator.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Bio Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">Bio</h3>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {creator.profile?.bio || "No bio available"}
                  </p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {[
                    { id: "overview", icon: BarChart3, label: currentLang.overview },
                    { id: "courses", icon: BookOpen, label: currentLang.courses },
                    { id: "analytics", icon: TrendingUp, label: currentLang.analytics },
                    { id: "messages", icon: MessageCircle, label: currentLang.messages },
                    { id: "settings", icon: Settings, label: currentLang.settings }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.id === "messages" && unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{currentLang.totalEarnings}</p>
                          <p className="text-2xl font-bold text-green-600">₹{formatNumber(stats.totalEarnings)}</p>
                          <p className="text-sm text-green-500">{stats.growth}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{currentLang.totalStudents}</p>
                          <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalStudents)}</p>
                          <p className="text-sm text-blue-500">+12% {currentLang.thisMonth}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{currentLang.totalCourses}</p>
                          <p className="text-2xl font-bold text-purple-600">{stats.totalCourses}</p>
                          <p className="text-sm text-purple-500">3 {language === "en" ? "this month" : "इस महीने"}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{currentLang.averageRating}</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                          <div className="flex items-center space-x-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Courses */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {currentLang.topPerforming}
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        {currentLang.viewAll}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.slice(0, 3).map((course) => (
                        <Card key={course.id} className="group hover:shadow-lg transition-all border-0 bg-gray-50/50">
                          <CardContent className="p-4">
                            <div className="relative mb-4">
                              <img
                                src={course.imgURL}
                                alt={course.title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                Bestseller
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                              {course.title}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-gray-600">{currentLang.earnings}:</span>
                                <span className="font-semibold text-green-600 ml-1">₹{formatNumber(course.price * course.salesCount)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{currentLang.students}:</span>
                                <span className="font-semibold ml-1">{formatNumber(course.salesCount)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{formatNumber(course.ContentAnalytics?.[0]?.views || 0)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{formatNumber(course.ContentAnalytics?.[0]?.likes || 0)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{course.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      {currentLang.recentActivity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === "sale" ? "bg-green-500" :
                            activity.type === "review" ? "bg-yellow-500" :
                            activity.type === "message" ? "bg-blue-500" :
                            "bg-purple-500"
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                          {activity.amount && (
                            <span className="text-sm font-medium text-green-600">
                              ₹{formatNumber(activity.amount)}
                            </span>
                          )}
                        </div>
                      )) : (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "courses" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                      {currentLang.courses}
                    </CardTitle>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Upload className="w-4 h-4 mr-2" />
                      {currentLang.uploadNew}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <Card key={course.id} className="group hover:shadow-lg transition-all border-0 bg-gray-50/50">
                        <CardContent className="p-4">
                          <div className="relative mb-4">
                            <img
                              src={course.imgURL}
                              alt={course.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                          
                          <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {course.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold ml-1">₹{course.price}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Sales:</span>
                              <span className="font-semibold ml-1">{course.salesCount}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "messages" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                      {currentLang.messages}
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white">
                          {unreadCount}
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  
                  {/* Filters and Search */}
                  <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search messages..."
                        value={messageSearch}
                        onChange={(e) => setMessageSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={messageFilter} onValueChange={(value: any) => setMessageFilter(value)}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
                        <SelectItem value="question">Questions</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {messages.length > 0 ? messages.map((message: any) => (
                      <Card 
                        key={message.id} 
                        className={`transition-all hover:shadow-md cursor-pointer ${
                          !message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : 'bg-gray-50/50'
                        }`}
                        onClick={() => markAsRead(message.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={message.fanAvatar} alt={message.fanName} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {message.fanName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold ${!message.isRead ? 'text-blue-700' : 'text-gray-900'}`}>
                                    {message.fanName}
                                  </h4>
                                  {getMessageTypeIcon(message.type)}
                                  {!message.isRead && (
                                    <Badge variant="secondary" className="text-xs">New</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(message.timestamp)}</span>
                                </div>
                              </div>
                              
                              <h5 className={`font-medium mb-1 ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {message.subject}
                              </h5>
                              
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {message.content}
                              </p>
                              
                              {message.courseName && (
                                <Badge variant="outline" className="text-xs mr-2">
                                  {message.courseName}
                                </Badge>
                              )}
                              
                              <div className="flex items-center gap-2 mt-3">
                                <Button size="sm" variant="outline">
                                  <Reply className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                                {!message.isRead && (
                                  <Button size="sm" variant="ghost">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark as Read
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {messageSearch || messageFilter !== 'all' 
                            ? 'No messages found matching your criteria' 
                            : 'No messages yet'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add similar content blocks for other tabs */}
            {activeTab !== "overview" && activeTab !== "courses" && activeTab !== "messages" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold capitalize">
                    {activeTab}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} section coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 