import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Log session extension for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Middleware: Session extended for path:', req.nextUrl.pathname);
    }
    
    // Add security headers
    const response = NextResponse.next()
    
    // Add security headers to prevent session hijacking
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Add session refresh headers for better session management
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Log authorization attempts for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Middleware auth check:', { 
            path: req.nextUrl.pathname, 
            hasToken: !!token,
            tokenSub: token?.sub 
          });
        }

        // FOR TESTING PURPOSES
        
        // Allow chat-test route without any auth requirement
        if (req.nextUrl.pathname.startsWith('/chat-test')) {
          return true;
        }
        
        // Always return true to allow all requests
        // Session validation will be handled by individual pages/APIs
        // This middleware mainly handles session extension and security headers
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - uploads (user uploaded files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public/|uploads/).*)",
  ],
} 