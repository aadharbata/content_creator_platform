"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Download, 
  Play, 
  FileText, 
  Shield, 
  Smartphone,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { isHighlyShareable, canBeDeliveredExternally } from "@/lib/content-delivery"

interface CourseAccess {
  id: string
  purchaseDate: string
  deliveryMethod: 'WHATSAPP' | 'EMAIL' | 'APP_ONLY'
  deliveryStatus: string
  course: {
    id: string
    title: string
    description: string
    imgURL: string
    author: {
      name: string
    }
    contents: Array<{
      id: string
      title: string
      description: string
      type: string
      url: string
      size?: number
    }>
  }
  contentDeliveries: Array<{
    id: string
    contentType: string
    deliveryMethod: string
    status: string
    deliveredAt: string | null
  }>
}

export default function MyCourses() {
  const [courses, setCourses] = useState<CourseAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    try {
      // TODO: Get actual user ID from auth context
      const userId = 'temp-user-id'
      
      const response = await fetch(`/api/my-courses/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
    setLoading(false)
  }

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'SENT':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'WHATSAPP':
        return <Smartphone className="w-4 h-4 text-green-600" />
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-blue-600" />
      case 'APP_ONLY':
        return <Shield className="w-4 h-4 text-purple-600" />
      default:
        return null
    }
  }

  const handleContentAccess = (content: any) => {
    if (isHighlyShareable(content.type)) {
      // Protected content - open in app viewer
      window.open(`/content-viewer/${content.id}`, '_blank')
    } else {
      // Regular content - direct download
      window.open(content.url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">
            Access your purchased courses and content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Protected Content</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => 
                      sum + course.course.contents.filter(c => isHighlyShareable(c.type)).length, 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => 
                      sum + course.course.contents.filter(c => canBeDeliveredExternally(c.type)).length, 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.deliveryStatus === 'DELIVERED' || c.deliveryStatus === 'SENT').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="app-only">App Only</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {courses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                  <p className="text-gray-600 mb-4">
                    Browse our marketplace to find amazing courses
                  </p>
                  <Button>
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              courses.map((courseAccess) => (
                <CourseCard 
                  key={courseAccess.id} 
                  courseAccess={courseAccess}
                  onContentAccess={handleContentAccess}
                  getDeliveryStatusIcon={getDeliveryStatusIcon}
                  getDeliveryMethodIcon={getDeliveryMethodIcon}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="app-only" className="space-y-6">
            {courses
              .filter(c => c.deliveryMethod === 'APP_ONLY')
              .map((courseAccess) => (
                <CourseCard 
                  key={courseAccess.id} 
                  courseAccess={courseAccess}
                  onContentAccess={handleContentAccess}
                  getDeliveryStatusIcon={getDeliveryStatusIcon}
                  getDeliveryMethodIcon={getDeliveryMethodIcon}
                />
              ))}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-6">
            {courses
              .filter(c => c.deliveryStatus === 'DELIVERED' || c.deliveryStatus === 'SENT')
              .map((courseAccess) => (
                <CourseCard 
                  key={courseAccess.id} 
                  courseAccess={courseAccess}
                  onContentAccess={handleContentAccess}
                  getDeliveryStatusIcon={getDeliveryStatusIcon}
                  getDeliveryMethodIcon={getDeliveryMethodIcon}
                />
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function CourseCard({ 
  courseAccess, 
  onContentAccess, 
  getDeliveryStatusIcon, 
  getDeliveryMethodIcon 
}: {
  courseAccess: CourseAccess
  onContentAccess: (content: any) => void
  getDeliveryStatusIcon: (status: string) => React.ReactNode
  getDeliveryMethodIcon: (method: string) => React.ReactNode
}) {
  const { course } = courseAccess
  const protectedContent = course.contents.filter(c => isHighlyShareable(c.type))
  const deliverableContent = course.contents.filter(c => canBeDeliveredExternally(c.type))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <img 
              src={course.imgURL} 
              alt={course.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
              <p className="text-gray-600 text-sm mb-2">{course.description}</p>
              <p className="text-sm text-gray-500">by {course.author.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getDeliveryMethodIcon(courseAccess.deliveryMethod)}
            {getDeliveryStatusIcon(courseAccess.deliveryStatus)}
            <Badge variant={courseAccess.deliveryStatus === 'DELIVERED' ? 'default' : 'secondary'}>
              {courseAccess.deliveryStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Protected Content Section */}
          {protectedContent.length > 0 && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-800">Protected Content (App Only)</h4>
              </div>
              <div className="space-y-2">
                {protectedContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{content.title}</p>
                        <p className="text-xs text-gray-600">{content.type}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => onContentAccess(content)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverable Content Section */}
          {deliverableContent.length > 0 && (
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-800">
                  Delivered Content ({courseAccess.deliveryMethod})
                </h4>
              </div>
              <div className="space-y-2">
                {deliverableContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{content.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{content.type}</span>
                          {content.size && <span>({content.size}MB)</span>}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onContentAccess(content)}
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
              
              {courseAccess.deliveryMethod !== 'APP_ONLY' && (
                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                  📱 Content also sent to your {courseAccess.deliveryMethod === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                </div>
              )}
            </div>
          )}

          {/* Purchase Details */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            Purchased on {new Date(courseAccess.purchaseDate).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}