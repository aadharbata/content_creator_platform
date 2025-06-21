"use client"

import { useState, useEffect, use } from "react"
import { 
  BookOpen, 
  Users, 
  Star, 
  MessageCircle, 
  Share2, 
  Heart,
  Eye,
  Calendar,
  MapPin,
  Globe,
  ShoppingCart,
  Crown,
  Search,
  Grid3X3,
  List,
  Languages,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Award,
  TrendingUp,
  CheckCircle,
  Bell,
  Bookmark,
  Clock,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"

interface Course {
  id: number
  title: string
  titleHi: string
  price: number
  originalPrice?: number
  students: number
  rating: number
  image: string
  category: string
  badge?: string
  description: string
  descriptionHi: string
  lastUpdated: string
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
}

interface Creator {
  id: string
  name: string
  nameHi: string
  bio: string
  bioHi: string
  avatar: string
  coverImage: string
  specialty: string
  specialtyHi: string
  location: string
  website: string
  joinedDate: string
  isVerified: boolean
  badge: string
  badgeHi: string
  totalStudents: number
  totalCourses: number
  averageRating: number
  followers: number
  totalReviews: number
  socialLinks: {
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
}

interface Review {
  id: number
  userName: string
  userAvatar: string
  rating: number
  comment: string
  date: string
  courseName: string
  isVerified: boolean
}

// Course Card Component
function CourseCard({ course, language, onBookmark, isBookmarked }: { 
  course: Course
  language: "en" | "hi"
  onBookmark: (id: number) => void
  isBookmarked: boolean
}) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-t-lg">
        <Image
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          width={300}
          height={200}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {course.level}
          </Badge>
          {course.badge && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              {course.badge}
            </Badge>
          )}
          {course.originalPrice && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white">
              Sale
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBookmark(course.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current text-blue-600" : "text-gray-600"}`} />
        </Button>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
          {language === "en" ? course.title : course.titleHi}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {language === "en" ? course.description : course.descriptionHi}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-sm font-medium">{course.rating}</span>
          </div>
          <span className="text-sm text-gray-500">({course.students.toLocaleString()} reviews)</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {course.category}
        </Badge>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">₹{course.price}</span>
            {course.originalPrice && (
              <span className="text-lg text-gray-500 line-through">₹{course.originalPrice}</span>
            )}
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href={`/course/${course.id}`}>View Course</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="border-0 bg-gray-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={review.userAvatar || "/placeholder.svg"} alt={review.userName} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {review.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{review.userName}</h4>
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              {review.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-2">{review.comment}</p>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{review.courseName}</span> • {review.date}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [bookmarkedCourses, setBookmarkedCourses] = useState<number[]>([])
  
  // State for real data
  const [creator, setCreator] = useState<Creator | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        
        // Fetch creator profile
        const creatorResponse = await fetch(`/api/creator/${id}`)
        if (!creatorResponse.ok) throw new Error('Failed to fetch creator data')
        const creatorData = await creatorResponse.json()
        
        // Transform creator data to match interface
        const transformedCreator: Creator = {
          id: creatorData.id,
          name: creatorData.name,
          nameHi: creatorData.name, // Use same name for Hindi
          bio: creatorData.profile?.bio || "No bio available",
          bioHi: creatorData.profile?.bio || "कोई बायो उपलब्ध नहीं",
          avatar: creatorData.profile?.avatarUrl || "/placeholder.svg?height=120&width=120",
          coverImage: "/placeholder.svg?height=400&width=1200", // Default cover image
          specialty: "Content Creator",
          specialtyHi: "कंटेंट क्रिएटर",
          location: "India",
          website: creatorData.profile?.website || "#",
          joinedDate: new Date(creatorData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          isVerified: true,
          badge: "Top Creator",
          badgeHi: "टॉप क्रिएटर",
          totalStudents: 0, // Will be calculated from courses
          totalCourses: 0,   // Will be calculated from courses
          averageRating: 0,  // Will be calculated from courses
          followers: Math.floor(Math.random() * 10000) + 1000, // Random for now
          totalReviews: 0,   // Will be calculated from reviews
          socialLinks: {
            twitter: creatorData.profile?.twitter || undefined,
            instagram: creatorData.profile?.instagram || undefined,
            youtube: creatorData.profile?.youtube || undefined
          }
        }

        // Fetch creator courses
        const coursesResponse = await fetch(`/api/creator/${id}/courses`)
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses')
        const coursesData = await coursesResponse.json()
        
        // Transform courses data
        const transformedCourses: Course[] = coursesData.map((course: any, index: number) => ({
          id: index + 1, // Use index as ID for now
          title: course.title,
          titleHi: course.title, // Use same title for Hindi
          price: course.price,
          originalPrice: course.price * 1.5, // 50% discount simulation
          students: course.salesCount,
          rating: course.rating,
          image: course.imgURL || "/placeholder.svg?height=200&width=300",
          category: "Development",
          badge: course.salesCount > 100 ? "Bestseller" : "Popular",
          description: course.description,
          descriptionHi: course.description, // Use same description for Hindi
          lastUpdated: new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          duration: course.duration ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m` : "N/A",
          level: course.price > 3000 ? "Advanced" : course.price > 2000 ? "Intermediate" : "Beginner"
        }))

        // Update creator stats based on courses
        transformedCreator.totalCourses = transformedCourses.length
        transformedCreator.totalStudents = transformedCourses.reduce((sum, course) => sum + course.students, 0)
        transformedCreator.averageRating = transformedCourses.length > 0 
          ? Math.round((transformedCourses.reduce((sum, course) => sum + course.rating, 0) / transformedCourses.length) * 100) / 100
          : 0

        // Generate mock reviews based on courses
        const mockReviews: Review[] = transformedCourses.slice(0, 3).map((course, index) => ({
          id: index + 1,
          userName: ["Priya Sharma", "Michael Chen", "Amit Kumar"][index],
          userAvatar: "/placeholder.svg?height=40&width=40",
          rating: Math.floor(course.rating),
          comment: `Great course! ${course.title} really helped me understand the concepts better. Highly recommended!`,
          date: `${index + 1} ${index === 0 ? 'week' : 'month'}${index > 0 ? 's' : ''} ago`,
          courseName: course.title,
          isVerified: true
        }))

        transformedCreator.totalReviews = mockReviews.length

        setCreator(transformedCreator)
        setCourses(transformedCourses)
        setReviews(mockReviews)

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

  // Translation object
  const t = {
    en: {
      joinedOn: "Joined",
      follow: "Follow",
      unfollow: "Following",
      message: "Message",
      students: "Students",
      totalCourses: "Courses",
      averageRating: "Rating",
      followers: "Followers",
      about: "About",
      courses: "Courses",
      reviews: "Reviews",
      allCourses: "All Courses",
      searchCourses: "Search courses...",
      popular: "Popular",
      newest: "Newest",
      priceHigh: "Price: High to Low",
      priceLow: "Price: Low to High",
      rating: "Rating",
      addToCart: "Add to Cart",
      enrollNow: "Enroll Now",
      preview: "Preview",
      whatStudentsSay: "What Students Say",
      verifiedPurchase: "Verified Purchase",
      expertise: "Expertise",
      connect: "Connect with me"
    },
    hi: {
      joinedOn: "शामिल हुए",
      follow: "फॉलो करें",
      unfollow: "फॉलो कर रहे हैं",
      message: "संदेश",
      students: "छात्र",
      totalCourses: "कोर्स",
      averageRating: "रेटिंग",
      followers: "फॉलोअर्स",
      about: "के बारे में",
      courses: "कोर्स",
      reviews: "समीक्षाएं",
      allCourses: "सभी कोर्स",
      searchCourses: "कोर्स खोजें...",
      popular: "लोकप्रिय",
      newest: "नवीनतम",
      priceHigh: "मूल्य: उच्च से निम्न",
      priceLow: "मूल्य: निम्न से उच्च",
      rating: "रेटिंग",
      addToCart: "कार्ट में जोड़ें",
      enrollNow: "अभी नामांकन करें",
      preview: "पूर्वावलोकन",
      whatStudentsSay: "छात्र क्या कहते हैं",
      verifiedPurchase: "सत्यापित खरीदारी",
      expertise: "विशेषज्ञता",
      connect: "मुझसे जुड़ें"
    }
  }

  const currentLang = t[language]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error loading profile</div>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Creator not found
  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Creator not found</p>
        </div>
      </div>
    )
  }

  // Filter courses based on search and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.titleHi.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || course.category.toLowerCase() === selectedCategory
    const matchesBookmark = !showBookmarked || bookmarkedCourses.includes(course.id)
    return matchesSearch && matchesCategory && matchesBookmark
  })

  const toggleBookmark = (courseId: number) => {
    setBookmarkedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleFollow = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsFollowing(!isFollowing)
      setIsLoading(false)
    }, 1000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: creator.name,
          text: `Check out ${creator.name}'s courses on our platform!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <Select value={language} onValueChange={(value: "en" | "hi") => setLanguage(value)}>
                <SelectTrigger className="w-20 bg-white/80 backdrop-blur-sm border-0 shadow-sm" suppressHydrationWarning>
                  <Languages className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                </SelectContent>
              </Select>
                              <Button variant="outline" size="sm" onClick={handleShare} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm" suppressHydrationWarning>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image 
          src={creator.coverImage || "/placeholder.svg"} 
          alt="Cover" 
          fill 
          className="object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {creator.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              {creator.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold mb-2">
                      {language === "en" ? creator.name : creator.nameHi}
                    </h1>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      {language === "en" ? creator.badge : creator.badgeHi}
                    </Badge>
                  </div>
                  <p className="text-xl text-gray-600 mb-4">
                    {language === "en" ? creator.specialty : creator.specialtyHi}
                  </p>
                  <p className="text-gray-600 max-w-2xl mb-4">
                    {language === "en" ? creator.bio : creator.bioHi}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{creator.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{currentLang.joinedOn} {creator.joinedDate}</span>
                    </div>
                    {creator.website && (
                      <Link href={creator.website} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/message/${creator.id}`}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {currentLang.message}
                    </Link>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleFollow}
                    disabled={isLoading}
                    className={isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                    )}
                    {isFollowing ? currentLang.unfollow : currentLang.follow}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{creator.totalStudents.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{currentLang.students}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{creator.totalCourses}</div>
              <div className="text-sm text-gray-600">{currentLang.totalCourses}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{creator.totalReviews.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{currentLang.reviews}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-600">{creator.averageRating}</span>
              </div>
              <div className="text-sm text-gray-600">{currentLang.averageRating}</div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="pb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="courses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {currentLang.courses}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {currentLang.reviews}
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {currentLang.about}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{currentLang.courses} ({creator.totalCourses})</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={currentLang.searchCourses}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-0 shadow-sm"
                  />
                </div>
                                 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                   <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-0 shadow-sm" suppressHydrationWarning>
                     <SelectValue placeholder="Category" />
                   </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
                                 <Button
                   variant="outline"
                   onClick={() => setShowBookmarked(!showBookmarked)}
                   className={showBookmarked ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white/80 backdrop-blur-sm border-0 shadow-sm"}
                   suppressHydrationWarning
                 >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Saved
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  language={language}
                  onBookmark={toggleBookmark}
                  isBookmarked={bookmarkedCourses.includes(course.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{currentLang.whatStudentsSay}</h2>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{creator.averageRating}</span>
                <span className="text-gray-600">({creator.totalReviews.toLocaleString()} reviews)</span>
              </div>
            </div>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">{currentLang.about} {creator.name}</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {language === "en" ? creator.bio : creator.bioHi}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    With over 8 years of experience in the tech industry, I've worked with startups and Fortune 500
                    companies, building scalable web applications and designing user-centered experiences. My passion
                    for teaching comes from my belief that technology should be accessible to everyone.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    When I'm not coding or creating courses, you can find me contributing to open-source projects,
                    speaking at tech conferences, or exploring the latest trends in web development and design.
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">{currentLang.expertise}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">JavaScript</Badge>
                    <Badge className="bg-green-100 text-green-800">React</Badge>
                    <Badge className="bg-purple-100 text-purple-800">Node.js</Badge>
                    <Badge className="bg-orange-100 text-orange-800">Full Stack</Badge>
                    <Badge className="bg-red-100 text-red-800">UI/UX Design</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">TypeScript</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>{currentLang.connect}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {creator.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <Link
                          href={creator.website}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Personal Website
                        </Link>
                      </div>
                    )}

                    {creator.socialLinks.youtube && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-red-600" />
                        <Link
                          href={creator.socialLinks.youtube}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          YouTube Channel
                        </Link>
                      </div>
                    )}

                    {creator.socialLinks.twitter && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                        <Link
                          href={creator.socialLinks.twitter}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Twitter
                        </Link>
                      </div>
                    )}

                    {creator.socialLinks.linkedin && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-700" />
                        <Link
                          href={creator.socialLinks.linkedin}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          LinkedIn
                        </Link>
                      </div>
                    )}

                    {creator.socialLinks.instagram && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-pink-600" />
                        <Link
                          href={creator.socialLinks.instagram}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Instagram
                        </Link>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {currentLang.joinedOn}{" "}
                        {new Date(creator.joinedDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 