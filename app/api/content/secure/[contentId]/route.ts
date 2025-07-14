import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { isHighlyShareable } from "@/lib/content-delivery"
import { getToken } from "next-auth/jwt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    // Extract user ID from NextAuth JWT
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
    }
    const jwtUser = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
    if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    const userId: string = jwtUser.id;
    
    // Get content with course information
    const content = await prisma.content.findUnique({
      where: {
        id: contentId
      },
      include: {
        course: {
          include: {
            author: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      )
    }

    // Check if this is protected content
    if (!isHighlyShareable(content.type)) {
      return NextResponse.json(
        { error: "Content is not protected - use direct download" },
        { status: 400 }
      )
    }

    // Check if user has access to this content through course purchase
    const courseAccess = await prisma.courseAccess.findFirst({
      where: {
        userId,
        courseId: content.courseId || undefined
      }
    })

    const hasAccess = !!courseAccess

    // Return content data with access information
    const secureContent = {
      id: content.id,
      title: content.title,
      description: content.description,
      type: content.type,
      url: content.url,
      metadata: content.metadata ? JSON.parse(content.metadata) : null,
      hasAccess,
      course: {
        title: content.course?.title || 'Standalone Content',
        author: {
          name: content.course?.author?.name || 'Unknown Creator'
        }
      }
    }

    // If user doesn't have access, still return basic info for error display
    if (!hasAccess) {
      return NextResponse.json(
        { 
          content: {
            ...secureContent,
            url: null, // Don't expose actual URL
            metadata: null // Don't expose metadata
          }
        },
        { status: 200 }
      )
    }

    // Generate secure, time-limited access URL if needed
    // In production, this would create a signed URL with expiration
    const secureUrl = `${content.url}?token=${generateSecureToken(contentId, userId)}&expires=${Date.now() + 3600000}` // 1 hour expiry
    
    return NextResponse.json({
      content: {
        ...secureContent,
        url: secureUrl
      }
    })

  } catch (error) {
    console.error("Error fetching secure content:", error)
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    )
  }
}

// Helper function to generate secure access tokens
function generateSecureToken(contentId: string, userId: string): string {
  // In production, this should be a proper JWT or signed token
  // For now, using a simple hash
  const timestamp = Date.now()
  const data = `${contentId}-${userId}-${timestamp}`
  
  // This is a simplified token - in production use proper JWT signing
  return Buffer.from(data).toString('base64')
}

// Optional: Add token validation endpoint
export async function POST() {
  try {
    // Validate token and return access status
    // This would verify JWT signature and expiration in production
    return NextResponse.json({
      valid: true,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    })
  } catch {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    )
  }
} 