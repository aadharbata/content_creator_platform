import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database storage...');
    
    // Get current session
    const session = await getServerSession(authOptions);
    
    // Get all users from database to compare storage patterns
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        phoneVerified: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    console.log('📊 Recent users in database:', users.length);
    
    // Categorize users by signup method
    const manualEmailUsers = users.filter(user => 
      user.passwordHash && user.passwordHash.length > 10 && !user.phone
    );
    
    const manualPhoneUsers = users.filter(user => 
      user.passwordHash && user.passwordHash.length > 10 && user.phone
    );
    
    const googleUsers = users.filter(user => 
      (!user.passwordHash || user.passwordHash === '') && 
      user.email && !user.phone && 
      !user.email.includes('@temp.com')
    );
    
    const analysis = {
      totalUsers: users.length,
      breakdown: {
        manualEmail: manualEmailUsers.length,
        manualPhone: manualPhoneUsers.length,
        google: googleUsers.length,
      },
      currentSession: session ? {
        authenticated: true,
        user: {
          id: (session.user as any)?.id,
          name: session.user?.name,
          email: session.user?.email,
          role: (session.user as any)?.role,
        }
      } : {
        authenticated: false
      },
      recentUsers: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        hasPassword: !!user.passwordHash && user.passwordHash.length > 0,
        signupMethod: user.passwordHash && user.passwordHash.length > 10 
          ? (user.phone ? 'manual-phone' : 'manual-email')
          : 'google-oauth',
        createdAt: user.createdAt,
      })),
      storageComparison: {
        manualSignup: {
          fields: ['name', 'email', 'passwordHash (hashed)', 'role', 'phone?', 'phoneVerified'],
          example: manualEmailUsers[0] || 'No manual users found'
        },
        googleSignup: {
          fields: ['name', 'email', 'passwordHash (empty)', 'role=CONSUMER', 'phoneVerified=false'],
          example: googleUsers[0] || 'No Google users found'
        }
      }
    };
    
    return NextResponse.json(analysis, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error testing database storage:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 