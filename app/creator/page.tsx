"use client"

import { useState } from "react"
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
  Play
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Course {
  id: number
  title: string
  price: number
  students: number
  rating: number
  image: string
  category: string
  badge: string
  earnings: string
  views: number
  likes: number
  downloads: number
}

interface CreatorStats {
  totalEarnings: string
  totalStudents: number
  totalCourses: number
  averageRating: number
  growth: string
  thisMonth: string
}

export default function CreatorPage() {
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [activeTab, setActiveTab] = useState("overview")

  // Helper function to format numbers consistently on server and client
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  // Mock data - in real app, this would come from API
  const creator = {
    name: "Sarah Johnson",
    nameHi: "सारा जॉनसन",
    bio: "Full-stack developer and educator with 8+ years of experience. Passionate about making complex concepts simple and accessible to everyone.",
    bioHi: "8+ साल के अनुभव के साथ फुल-स्टैक डेवलपर और शिक्षक। जटिल अवधारणाओं को सरल और सबके लिए सुलभ बनाने का जुनून।",
    avatar: "/placeholder.svg?height=120&width=120",
    specialty: "Web Development",
    specialtyHi: "वेब डेवलपमेंट",
    joined: "March 2022",
    badge: "Top Creator",
    badgeHi: "टॉप क्रिएटर"
  }

  const stats: CreatorStats = {
    totalEarnings: "$125,430",
    totalStudents: 45123,
    totalCourses: 12,
    averageRating: 4.9,
    growth: "+23.5%",
    thisMonth: "$12,340"
  }

  const courses: Course[] = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      price: 89,
      students: 12543,
      rating: 4.9,
      image: "/placeholder.svg?height=200&width=300",
      category: "Development",
      badge: "Bestseller",
      earnings: "$89,432",
      views: 156789,
      likes: 8934,
      downloads: 12543
    },
    {
      id: 2,
      title: "React Advanced Patterns",
      price: 67,
      students: 8932,
      rating: 4.8,
      image: "/placeholder.svg?height=200&width=300",
      category: "Development", 
      badge: "Hot",
      earnings: "$45,678",
      views: 89234,
      likes: 5432,
      downloads: 8932
    },
    {
      id: 3,
      title: "JavaScript Fundamentals",
      price: 45,
      students: 15678,
      rating: 4.7,
      image: "/placeholder.svg?height=200&width=300",
      category: "Development",
      badge: "Popular",
      earnings: "$34,567",
      views: 234567,
      likes: 12345,
      downloads: 15678
    }
  ]

  const recentActivity = [
    { type: "sale", message: "New student enrolled in React Advanced Patterns", time: "2 hours ago" },
    { type: "review", message: "5-star review on Web Development Bootcamp", time: "4 hours ago" },
    { type: "message", message: "New message from Alex Chen", time: "6 hours ago" },
    { type: "achievement", message: "Reached 45k total students milestone!", time: "1 day ago" }
  ]

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
      joined: "Joined"
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
      joined: "शामिल हुए"
    }
  }

  const currentLang = t[language]

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
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                {currentLang.messages}
              </Button>
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
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {creator.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-3">
                    {language === "en" ? creator.badge : creator.badgeHi}
                  </Badge>
                  
                  <h2 className="text-xl font-bold mb-2">
                    {language === "en" ? creator.name : creator.nameHi}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {language === "en" ? creator.specialty : creator.specialtyHi}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentLang.joined} {creator.joined}
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
                    {language === "en" ? creator.bio : creator.bioHi}
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
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
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
                          <p className="text-2xl font-bold text-green-600">{stats.totalEarnings}</p>
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
                          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
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
                      {courses.map((course) => (
                        <Card key={course.id} className="group hover:shadow-lg transition-all border-0 bg-gray-50/50">
                          <CardContent className="p-4">
                            <div className="relative mb-4">
                              <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {course.badge}
                              </Badge>
                            </div>
                            
                            <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                              {course.title}
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-gray-600">{currentLang.earnings}:</span>
                                <span className="font-semibold text-green-600 ml-1">{course.earnings}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{currentLang.students}:</span>
                                <span className="font-semibold ml-1">{formatNumber(course.students)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{formatNumber(course.views)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{formatNumber(course.likes)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{course.rating}</span>
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
                      {recentActivity.map((activity, index) => (
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
                        </div>
                      ))}
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
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Course management interface would go here</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add similar content blocks for other tabs */}
            {activeTab !== "overview" && activeTab !== "courses" && (
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