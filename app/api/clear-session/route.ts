import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔍 CLEAR SESSION - Clearing all NextAuth cookies and session data');
  
  const response = NextResponse.json({ 
    success: true, 
    message: 'All session cookies cleared successfully',
    timestamp: new Date().toISOString()
  });
  
  // Clear all possible NextAuth cookies including secure variants
  const cookiesToClear = [
    // Standard NextAuth cookies
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    'next-auth.pkce.code_verifier',
    'next-auth.state',
    
    // Secure variants (production)
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.pkce.code_verifier',
    '__Secure-next-auth.state',
    
    // Host variants
    '__Host-next-auth.csrf-token',
    '__Host-next-auth.session-token',
    '__Host-next-auth.callback-url',
    
    // Legacy cookie names (in case they exist)
    'next-auth.session',
    'next-auth.token',
    '__Secure-next-auth.session',
    '__Secure-next-auth.token',
    
    // Custom app cookies that might interfere
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token'
  ];
  
  // Clear each cookie with multiple configurations to ensure complete removal
  cookiesToClear.forEach(cookieName => {
    // Clear with standard options
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Clear with secure options (for production cookies)
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    // Clear with different path options
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      expires: new Date(0),
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  });
  
  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  console.log('✅ CLEAR SESSION - All cookies cleared, cache headers set');
  
  return response;
} 