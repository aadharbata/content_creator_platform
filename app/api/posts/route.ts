import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import formidable from 'formidable'
import jwt from 'jsonwebtoken'

export const config = {
  api: {
    bodyParser: false,
  },
}

const defaultUserId = 'test-user-id'

function isImageOrVideo(mimetype: string) {
  return mimetype.startsWith('image/') || mimetype.startsWith('video/')
}

export async function POST(req: NextRequest) {
  // --- Backend authentication check ---
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtSecret = process.env.JWT_SECRET || 'aadhar123'
  let jwtUser: { userId: string, role: string } | null = null
  if (!token) {
    return NextResponse.json({ error: 'Missing authentication token.' }, { status: 401 })
  }
  try {
    jwtUser = jwt.verify(token, jwtSecret) as { userId: string, role: string }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 })
  }

  // Parse multipart form
  const form = new formidable.IncomingForm({ multiples: true, uploadDir: './public/uploads', keepExtensions: true })
  await fs.mkdir('./public/uploads', { recursive: true })

  const data = await new Promise<{ fields: any, files: any }>((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })

  const { title, content, isPaidOnly, creatorId } = data.fields
  let files = data.files.media
  if (!Array.isArray(files)) files = files ? [files] : []

  // Only allow images/videos
  const allowedFiles = files.filter((file: any) => isImageOrVideo(file.mimetype))

  // --- Authorization: Only allow if JWT user matches creatorId and is CREATOR ---
  if (!creatorId || jwtUser.userId !== creatorId || jwtUser.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Not authorized to create post for this creator.' }, { status: 403 })
  }

  // Find creator profile
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: creatorId } })
  if (!creatorProfile) return NextResponse.json({ error: 'No creator profile' }, { status: 404 })

  // Create post
  const post = await prisma.post.create({
    data: {
      title,
      content,
      isPaidOnly: isPaidOnly === 'true' || isPaidOnly === true,
      creatorId: creatorProfile.id,
    },
  })

  // Save media
  for (const file of allowedFiles) {
    const ext = path.extname(file.originalFilename)
    const newName = uuidv4() + ext
    const dest = path.join('./public/uploads', newName)
    await fs.rename(file.filepath, dest)
    await prisma.postMedia.create({
      data: {
        url: `/uploads/${newName}`,
        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
        postId: post.id,
      },
    })
  }

  return NextResponse.json({ post })
} 