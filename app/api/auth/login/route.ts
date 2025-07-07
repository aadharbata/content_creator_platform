import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

/**
 * @deprecated This route is deprecated. Use the NextAuth signin flow with the "credentials" provider.
 */
export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated. Please use the NextAuth signin flow.' },
    { status: 404 }
  );
} 