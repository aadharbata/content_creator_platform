"use client"

import { useState, useEffect, use } from "react"
import { 
  Users, 
  Star, 
  MessageCircle, 
  Share2, 
  Calendar,
  MapPin,
  Globe,
  Crown,
  Search,
  Languages,
  ExternalLink,
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
import { useDebounce } from "@/lib/hooks"
import { cn } from "@/lib/utils"
import { getTranslations, type Language } from "@/lib/translations"
import { ApiError, NetworkError, handleApiError } from "@/lib/types/errors"

// Constants
const COURSE_LEVELS = {
  BEGINNER: { threshold: 0, max: 2000 },
  INTERMEDIATE: { threshold: 2000, max: 3000 },
  ADVANCED: { threshold: 3000, max: Infinity }
} as const

const COURSE_BADGES = {
  BESTSELLER: { threshold: 100, label: 'bestseller' },
  POPULAR: { threshold: 50, label: 'mostPopular' },
  TOP_RATED: { threshold: 20, reviewKey: '_count.reviews', label: 'highestRated' },
  NEW: { threshold: 0, label: 'new' }
} as const

const DEBOUNCE_DELAY = 300

// Interfaces
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

interface CreatorStats {
  totalEarnings: number
  totalStudents: number
  totalCourses: number
  averageRating: number
  growth: string
  thisMonth: number
}

// Utility functions
const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes || isNaN(minutes) || minutes < 0) {
    return '0m'
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getBadge = (course: Course, t: any) => {
  if (course.salesCount >= COURSE_BADGES.BESTSELLER.threshold) return t[COURSE_BADGES.BESTSELLER.label]
  if (course.salesCount >= COURSE_BADGES.POPULAR.threshold) return t[COURSE_BADGES.POPULAR.label]
  if (course._count.reviews >= COURSE_BADGES.TOP_RATED.threshold) return t[COURSE_BADGES.TOP_RATED.label]
  return 'New'
}

const getLevel = (price: number): string => {
  if (price >= COURSE_LEVELS.ADVANCED.threshold) return "Advanced"
  if (price >= COURSE_LEVELS.INTERMEDIATE.threshold) return "Intermediate"
  return "Beginner"
}

const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Course Card Component
function CourseCard({ course, language, t }: { 
  course: Course
  language: Language
  t: any
}) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-0 bg-white/80 backdrop-blur-sm h-full flex flex-col">
      <div className="relative overflow-hidden rounded-t-lg">
        <Image
          src={course.imgURL || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center`}
          alt={course.title}
          width={300}
          height={200}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {getLevel(course.price)}
          </Badge>
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            {getBadge(course, t)}
            </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 min-h-[4.5rem]">
          {course.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <div className="flex items-center gap-2 mb-2 min-h-[1.5rem]">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="ml-1 text-sm font-medium" aria-label={`Rating: ${course.rating.toFixed(1)} out of 5`}>
              {course.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            ({course._count.reviews} {course._count.reviews === 1 ? 'review' : t.reviews})
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2 min-h-[1.5rem]">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>{course.salesCount.toLocaleString()} {t.students}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{formatDuration(course.duration)}</span>
          </div>
        </div>
        
        <div className="min-h-[1.5rem]">
          <Badge variant="outline" className="text-xs">
            {course.category}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 mt-auto flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">₹{course.price.toLocaleString()}</span>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href={`/course/${course.id}`}>{t.viewCourse}</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Review Card Component
function ReviewCard({ review, t }: { review: Review; t: any }) {
  return (
    <Card className="border-0 bg-gray-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={review.userAvatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`} alt={review.userName} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {review.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{review.userName}</h4>
              <div className="flex items-center" role="img" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
              {review.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  {t.verified}
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

  const [language, setLanguage] = useState<Language>("en")
  const [searchQuery, setSearchQuery] = useState("")
  
  // State for real data
  const [creator, setCreator] = useState<Creator | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY)

  // Get translations
  const t = getTranslations(language)

  // Fetch all creator data
  useEffect(() => {
    let isMounted = true

    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all data in parallel
        const [creatorResponse, coursesResponse, reviewsResponse, statsResponse] = await Promise.all([
          fetch(`/api/creator/${id}`),
          fetch(`/api/creator/${id}/courses`),
          fetch(`/api/creator/${id}/reviews`),
          fetch(`/api/creator/${id}/stats`)
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
        
        if (!reviewsResponse.ok) {
          throw new ApiError('Failed to fetch reviews', reviewsResponse.status, `/api/creator/${id}/reviews`)
        }
        
        if (!statsResponse.ok) {
          throw new ApiError('Failed to fetch stats', statsResponse.status, `/api/creator/${id}/stats`)
        }

        const [creatorData, coursesData, reviewsData, statsData] = await Promise.all([
          creatorResponse.json(),
          coursesResponse.json(), 
          reviewsResponse.json(),
          statsResponse.json()
        ])

        if (isMounted) {
          setCreator(creatorData)
          setCourses(coursesData)
          setReviews(reviewsData)
          setStats(statsData)
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

  // Filter courses based on debounced search
  const filteredCourses = courses.filter(course => {
    if (!debouncedSearchQuery) return true
    const query = debouncedSearchQuery.toLowerCase()
    return course.title.toLowerCase().includes(query) ||
           course.description.toLowerCase().includes(query)
  })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: creator?.name || 'Creator Profile',
          text: `Check out ${creator?.name}'s courses on our platform!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: Show toast notification
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-lg text-gray-600" role="status">{t.loadingProfile}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{t.errorLoadingProfile}</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t.retry}
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
          <p className="text-lg text-gray-600 mb-4">{t.creatorNotFound}</p>
          <Button asChild>
            <Link href="/">{t.backToHome}</Link>
          </Button>
        </div>
      </div>
    )
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
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger className="w-20 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                  <Languages className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleShare} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                  <Share2 className="w-4 h-4 mr-2" />
                {t.share}
                </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
          alt="Cover" 
          fill 
          className="object-cover" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={creator.profile?.avatarUrl || "/placeholder.svg"} alt={creator.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {creator.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <Crown className="w-6 h-6 text-white" />
                </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold mb-2">
                      {creator.name}
                    </h1>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      Top Creator
                    </Badge>
                  </div>
                  <p className="text-xl text-gray-600 mb-4">
                    {t.creator} & Educator
                  </p>
                  <p className="text-gray-600 max-w-2xl mb-4">
                    {creator.profile?.bio || t.defaultBio}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>India</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{t.joinedOn} {new Date(creator.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {creator.profile?.website && (
                      <Link href={creator.profile.website} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t.messagesSoon}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Using real data from API */}
          {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalStudents.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{t.students}</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalCourses}</div>
                <div className="text-sm text-gray-600">{t.totalCourses}</div>
            </div>
            <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{stats.totalEarnings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{t.totalEarnings}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</span>
                </div>
                <div className="text-sm text-gray-600">{t.averageRating}</div>
              </div>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="pb-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="courses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {t.courses}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {t.reviews}
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              {t.about}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.courses} ({courses.length})</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t.searchCourses}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/80 backdrop-blur-sm border-0 shadow-sm"
                    aria-label="Search courses"
                  />
                </div>
              </div>
            </div>
            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-2">
                  {searchQuery ? t.noResults : t.noCoursesYet}
                </p>
                <p className="text-gray-500">
                  {searchQuery ? t.tryDifferentSearch : t.checkBackLater}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">
                    {t.clearSearch}
                  </Button>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  language={language}
                    t={t}
                />
              ))}
            </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.whatStudentsSay}</h2>
              {stats && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-gray-600">({reviews.length} {t.reviews})</span>
              </div>
              )}
            </div>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-2">{t.noReviewsYet}</p>
                <p className="text-gray-500">{t.reviewsWillAppear}</p>
              </div>
            ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} t={t} />
              ))}
            </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">{t.about} {creator.name}</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {creator.profile?.bio || t.defaultBio}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    With extensive experience in content creation and education, I specialize in creating comprehensive courses that help students achieve their learning goals. My teaching approach focuses on practical, hands-on learning that students can immediately apply.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    When I'm not creating courses, you can find me exploring new technologies, contributing to the community, and staying updated with the latest industry trends.
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">{t.expertise}</h3>
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
                    <CardTitle>{t.connect}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {creator.profile?.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <Link
                          href={creator.profile.website}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Personal Website
                        </Link>
                      </div>
                    )}

                    {creator.profile?.youtube && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-red-600" />
                        <Link
                          href={creator.profile.youtube}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          YouTube Channel
                        </Link>
                      </div>
                    )}

                    {creator.profile?.twitter && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                        <Link
                          href={creator.profile.twitter}
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Twitter
                        </Link>
                      </div>
                    )}

                    {creator.profile?.instagram && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-pink-600" />
                        <Link
                          href={creator.profile.instagram}
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
                        {t.joinedOn}{" "}
                        {new Date(creator.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', {
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