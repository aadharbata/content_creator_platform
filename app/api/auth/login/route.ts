import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Instead of custom JWT, call NextAuth's signIn endpoint
    // The frontend should use NextAuth's signIn for login
    return NextResponse.json({
      message: 'Please use /api/auth/signin (NextAuth) for login.'
    }, { status: 400 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
} 