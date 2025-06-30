"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useDebounce } from "@/lib/hooks"
import { ApiError, NetworkError, handleApiError } from "@/lib/types/errors"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import { 
  Search, 
  Star, 
  Users, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Grid3X3,
  Languages,
  TrendingUp,
  Award,
  BookOpen,
  IndianRupee,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import Link from "next/link"

// Constants
const FEATURED_COURSES_RATING_THRESHOLD = 4.5
const MAX_FEATURED_COURSES = 2
const SEARCH_DEBOUNCE_DELAY = 500
const PRICE_DEBOUNCE_DELAY = 800
const PAGINATION_LIMIT = 12
const MAX_PAGINATION_BUTTONS = 5

// Utility functions
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getBadgeStyles = (badge: string) => {
  switch (badge) {
    case 'Bestseller': return 'bg-orange-500 hover:bg-orange-600'
    case 'Popular': return 'bg-blue-500 hover:bg-blue-600'
    default: return 'bg-green-500 hover:bg-green-600'
  }
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  rating: number
  reviewCount: number
  salesCount: number
  duration: number
  imgURL: string
  category: string
  author: {
    id: string
    name: string
    avatarUrl: string
  }
  badge?: string | null
}

interface FeaturedCourse extends Course {
  isFeatured: boolean
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Course Card Component - Optimized for mobile
function CourseCard({ course }: { course: Course }) {

  return (
    <Card className="group flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm overflow-hidden h-full">
      <div className="relative overflow-hidden">
        <Image
          src={course.imgURL || "/placeholder.svg"}
          alt={course.title}
          width={300}
          height={180}
          className="w-full h-40 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay with play button on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {course.badge && (
            <Badge className={`text-xs font-semibold px-2 py-1 ${getBadgeStyles(course.badge)} text-white border-0`}>
              {course.badge}
            </Badge>
          )}
        </div>

        {/* Price badge - prominent for Indian users */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-2 py-1">
            <IndianRupee className="w-3 h-3 mr-1" />
            {course.price.toLocaleString('en-IN')}
          </Badge>
        </div>


      </div>

      <CardContent className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Category */}
        <Badge variant="outline" className="w-fit mb-2 text-xs">
          {course.category}
        </Badge>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[45px]">
          {course.title}
        </h3>

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
            <AvatarImage src={course.author.avatarUrl} alt={course.author.name} />
            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
              {course.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">{course.author.name}</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-4 min-h-[42px]">
          {course.description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
            {/* Rating and stats */}
            <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm text-gray-800">{course.rating}</span>
                <span className="ml-1">({course.reviewCount})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{course.salesCount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm font-semibold">
              View Details
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Featured Course Component (larger card for trending section)
function FeaturedCourseCard({ course }: { course: FeaturedCourse }) {
  return (
    <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
      <div className="sm:flex">
        <div className="relative sm:w-1/2">
          <Image
            src={course.imgURL || "/placeholder.svg"}
            alt={course.title}
            width={400}
            height={250}
            className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-500 text-black font-bold text-xs">
              <Award className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-2 py-1">
              <IndianRupee className="w-3 h-3 mr-1" />
              {course.price.toLocaleString('en-IN')}
            </Badge>
          </div>
        </div>

        <div className="sm:w-1/2 p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <Badge variant="outline" className="w-fit mb-3 text-xs">
              {course.category}
            </Badge>
            
            <h3 className="font-bold text-lg sm:text-xl leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {course.description}
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="w-6 h-6">
                <AvatarImage src={course.author.avatarUrl} alt={course.author.name} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                  {course.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 font-medium">{course.author.name}</span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-800">{course.rating}</span>
                <span className="ml-1">({course.reviewCount})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{course.salesCount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
              </div>
            </div>
            
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold">
              Explore Course
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function HomePage() {
  const { language, setLanguage, translations } = useLanguage()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGINATION_LIMIT,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
  
  // Initialize filters from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "all")
  const [sortBy, setSortBy] = useState("newest")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minRating, setMinRating] = useState("any")
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  // Debounced values using custom hook
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_DELAY)
  const debouncedMinPrice = useDebounce(minPrice, PRICE_DEBOUNCE_DELAY)
  const debouncedMaxPrice = useDebounce(maxPrice, PRICE_DEBOUNCE_DELAY)
  
  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: debouncedSearch,
        category: selectedCategory,
        sortBy: sortBy,
        ...(debouncedMinPrice && { minPrice: debouncedMinPrice }),
        ...(debouncedMaxPrice && { maxPrice: debouncedMaxPrice }),
        ...(minRating !== "any" && { minRating: minRating })
      })

      const [coursesResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/courses/allcourses?${params}`),
        fetch(`/api/categories`)
      ])

      if (!coursesResponse.ok) {
        throw new ApiError(
          'Failed to fetch courses', 
          coursesResponse.status, 
          '/api/courses/allcourses'
        )
      }

      if (!categoriesResponse.ok) {
        throw new ApiError(
          'Failed to fetch categories', 
          categoriesResponse.status, 
          '/api/categories'
        )
      }

      const [coursesData, categoriesData] = await Promise.all([
        coursesResponse.json(),
        categoriesResponse.json()
      ])

      setCourses(coursesData.courses)
      setPagination(coursesData.pagination)
      setCategories(categoriesData)
      setHasLoadedOnce(true);

      // Set featured courses (top rated courses for featured section)
      if (pagination.page === 1) {
        const featured = coursesData.courses
          .filter((course: Course) => course.rating >= FEATURED_COURSES_RATING_THRESHOLD)
          .slice(0, MAX_FEATURED_COURSES)
          .map((course: Course) => ({ ...course, isFeatured: true }))
        setFeaturedCourses(featured)
      }

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(handleApiError(new NetworkError(), ''))
      } else {
        setError(handleApiError(err, '/api/courses'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses();
  }, [debouncedSearch, selectedCategory, sortBy, debouncedMinPrice, debouncedMaxPrice, minRating, pagination.page]);

  // Handle search from landing page - scroll to results when loaded with search params
  useEffect(() => {
    const searchFromLanding = searchParams.get('search')
    const categoryFromLanding = searchParams.get('category')
    
    if (searchFromLanding || categoryFromLanding) {
      // Small delay to ensure components are mounted
      setTimeout(() => {
        // Scroll to search results section smoothly
        const resultsSection = document.querySelector('[data-results-section]')
        if (resultsSection) {
          resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }
      }, 500)
    }
  }, [searchParams])

  const handlePageChange = (newPage: number) => {
    if (newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading && !hasLoadedOnce) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{translations.loadingCourses}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {translations.courseHub}
              </h1>
            </div>
            
            {/* Language Switcher */}
            <Select value={language} onValueChange={(value: "en" | "hi") => setLanguage(value)}>
              <SelectTrigger className="w-16 sm:w-20 bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <Languages className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="hi">हि</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        {/* Featured Courses Section */}
        {featuredCourses.length > 0 && pagination.page === 1 && (
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold">{translations.featuredCourses}</h2>
            </div>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {featuredCourses.map((course) => (
                <FeaturedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Filters Section - Single row with search on right */}
        <section className="mb-4 sm:mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
              {/* Left side - Search */}
              <div className="lg:w-80 lg:flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder={translations.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-10 sm:h-12 text-sm sm:text-base bg-white border-0 shadow-sm"
                  />
                </div>
              </div>

              {/* Right side - All filters */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white border-0 shadow-sm text-xs sm:text-sm">
                    <SelectValue placeholder={translations.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.allCategories}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white border-0 shadow-sm text-xs sm:text-sm">
                    <SelectValue placeholder={translations.sortBy} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{translations.newest}</SelectItem>
                    <SelectItem value="popular">{translations.popular}</SelectItem>
                    <SelectItem value="rating">{translations.rating}</SelectItem>
                    <SelectItem value="price_low">{translations.priceLow}</SelectItem>
                    <SelectItem value="price_high">{translations.priceHigh}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={translations.minPrice}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="bg-white border-0 shadow-sm text-xs sm:text-sm"
                  type="number"
                />

                <Input
                  placeholder={translations.maxPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="bg-white border-0 shadow-sm text-xs sm:text-sm"
                  type="number"
                />

                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="bg-white border-0 shadow-sm text-xs sm:text-sm col-span-2 sm:col-span-1">
                    <SelectValue placeholder={translations.minRating} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{translations.anyRating}</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Results Header */}
        <div data-results-section className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold">
              {searchParams.get('search') ? 
                `${translations.searchResults || 'Search Results'} (${pagination.totalCount.toLocaleString('en-IN')})` :
                `${translations.allCourses} (${pagination.totalCount.toLocaleString('en-IN')})`
              }
            </h2>
          </div>
          {searchParams.get('search') && (
            <div className="text-sm text-gray-600">
              {translations.searchingFor || 'Searching for'}: <span className="font-semibold text-blue-600">"{searchParams.get('search')}"</span>
            </div>
          )}
        </div>

        {/* Courses Grid - Responsive */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{translations.errorLoading}</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchCourses}>{translations.retry}</Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600 mb-2">{translations.noCoursesFound}</p>
            <p className="text-gray-500">{translations.tryAdjusting}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Pagination - Mobile optimized */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-sm text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{translations.previous}</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(MAX_PAGINATION_BUTTONS, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={page === pagination.page 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-xs sm:text-sm" 
                      : "bg-white/80 backdrop-blur-sm border-0 shadow-sm text-xs sm:text-sm"
                    }
                  >
                    {page}
                  </Button>
                )
              })}
              
              {pagination.totalPages > 5 && (
                <>
                  <span className="px-2 text-gray-500 text-sm">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className="bg-white/80 backdrop-blur-sm border-0 shadow-sm text-xs sm:text-sm"
                  >
                    {pagination.totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-sm text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{translations.next}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading overlay for subsequent fetches */}
      {loading && hasLoadedOnce && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      )}
    </div>
  )
}