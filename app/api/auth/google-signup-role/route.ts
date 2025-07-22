import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();
    
    if (!role || !['CREATOR', 'CONSUMER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Store role in a secure cookie that expires in 10 minutes
    const response = NextResponse.json({ success: true });
    response.cookies.set('signup-role', role, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Error storing signup role:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 