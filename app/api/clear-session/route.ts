import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Clear all NextAuth cookies
    const cookieStore = cookies();
    
    // Get all NextAuth cookie names (they usually start with these prefixes)
    const nextAuthCookieNames = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      'next-auth.pkce.code_verifier'
    ];
    
    const response = NextResponse.json({ 
      success: true, 
      message: "Session cookies cleared successfully" 
    });
    
    // Clear each NextAuth cookie
    nextAuthCookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    
    // Also clear any cookies that might exist for different domains/paths
    response.cookies.set('next-auth.session-token', '', { 
      expires: new Date(0),
      path: '/',
      domain: 'localhost'
    });
    
    response.cookies.set('__Secure-next-auth.session-token', '', { 
      expires: new Date(0),
      path: '/',
      secure: true
    });
    
    console.log("🔍 CLEAR SESSION - All NextAuth cookies cleared");
    
    return response;
  } catch (error) {
    console.error("Error clearing session:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to clear session" 
    }, { status: 500 });
  }
} 