"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Shield, 
  FileText, 
  Download, 
  Eye,
  AlertTriangle,
  Lock
} from "lucide-react"
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

interface SecureContent {
  id: string
  title: string
  description: string
  type: string
  url: string
  metadata: Record<string, unknown> | null
  hasAccess: boolean
  course: {
    title: string
    author: {
      name: string
    }
  }
}

export default function ContentViewer() {
  const params = useParams()
  const contentId = params.contentId as string
  const [content, setContent] = useState<SecureContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession();

  const fetchSecureContent = async () => {
    try {
      // Use NextAuth JWT token from session
      const token = (session as Session & { accessToken?: string })?.accessToken;
      const response = await fetch(`/api/content/secure/${contentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setContent(data.content)
      } else if (response.status === 403) {
        setError("You don't have access to this content")
      } else {
        setError("Content not found")
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
      setError("Failed to load content")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSecureContent()
  }, [contentId, fetchSecureContent])

  const renderContent = () => {
    if (!content) return null

    switch (content.type) {
      case 'EBOOK':
        return <PDFViewer url={content.url} />
      case 'TEMPLATE':
        return <TemplateViewer content={content} />
      case 'SOFTWARE':
        return <SoftwareDownload content={content} />
      case 'COURSE':
        return <CourseContent content={content} />
      default:
        return <GenericViewer content={content} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!content?.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Required</h3>
            <p className="text-gray-600 mb-4">
              You need to purchase this course to access this content.
            </p>
            <Button>Purchase Course</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{content.title}</h1>
                <p className="text-sm text-gray-600">
                  from {content.course.title} by {content.course.author.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Membership Buttons */}
              <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold shadow-md hover:from-green-500 hover:to-blue-600 transition-colors">
                Free
              </Button>
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow-md hover:from-yellow-500 hover:to-orange-600 transition-colors">
                Paid Membership
              </Button>
              <Badge className="bg-purple-100 text-purple-800">
                <Shield className="w-3 h-3 mr-1" />
                Protected Content
              </Badge>
              <Badge variant="outline">{content.type}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              This content is protected and can only be viewed within this app. 
              Screenshots and downloads are monitored for security.
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderContent()}
      </div>

      {/* Watermark overlay (subtle) */}
      <div className="fixed bottom-4 right-4 pointer-events-none">
        <div className="bg-black/10 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600">
          Licensed to User • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

function PDFViewer({ url }: { url: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          PDF Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[800px] border rounded-lg overflow-hidden">
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full"
            style={{ minHeight: '800px' }}
          />
        </div>
        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          This PDF is protected and cannot be downloaded or printed.
        </div>
      </CardContent>
    </Card>
  )
}

function TemplateViewer({ content }: { content: SecureContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Template Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="font-medium mb-2">{content.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{content.description}</p>
            
            <div className="flex items-center gap-4">
              <Button>
                <Eye className="w-4 h-4 mr-2" />
                Preview Template
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download for Personal Use
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
            <strong>License Terms:</strong> This template is licensed for personal use only. 
            Commercial redistribution is prohibited.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SoftwareDownload({ content }: { content: SecureContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Software Download
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-6 border rounded-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-medium mb-2">{content.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{content.description}</p>
            
            <Button size="lg" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Software
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 p-3 bg-red-50 border border-red-200 rounded">
            <strong>Important:</strong> This software is licensed to you personally. 
            Sharing or distributing this software is strictly prohibited and may result in legal action.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CourseContent({ content }: { content: SecureContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Course Material
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.description || '' }} />
        </div>
      </CardContent>
    </Card>
  )
}

function GenericViewer({ content }: { content: SecureContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{content.description}</p>
        <Button>
          <Eye className="w-4 h-4 mr-2" />
          View Content
        </Button>
      </CardContent>
    </Card>
  )
} 