import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  path: string;
}

// S3 configuration from environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const S3_BUCKET = process.env.AWS_S3_BUCKET!;

export async function POST(request: NextRequest) {
  try {
    // Get session and userId
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch creatorProfile by userId
    const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (!creatorProfile) {
      return NextResponse.json({ error: 'No creator profile found for user' }, { status: 404 });
    }
    const creatorId = creatorProfile.id;

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const contentType = formData.get('contentType') as string;
    const price = parseFloat(formData.get('price') as string);
    const contentFor = formData.get('contentFor') as string;
    const language = formData.get('language') as string;
    const licensingType = formData.get('licensingType') as string;
    const tags = formData.get('tags') as string;
    const demoLink = formData.get('demoLink') as string;
    const notes = formData.get('notes') as string;
    
    // Get files
    const files = formData.getAll('files') as File[];
    
    if (!title || !description || !contentType || !contentFor || !language) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Check for required AWS S3 environment variables
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
      console.log('[UPLOAD] AWS S3 credentials or bucket not configured. Skipping actual upload, but code is running.');
      // Simulate S3 upload result for testing
      const savedFiles: UploadedFile[] = files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        path: `/simulated-s3-url/${file.name}`
      }));
      console.log('[UPLOAD] Simulated file upload:', savedFiles);
      // Prepare content metadata
      const contentMetadata = {
        title,
        description,
        contentType,
        price,
        contentFor,
        language,
        licensingType,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        demoLink,
        notes,
        files: savedFiles,
        uploadedAt: new Date().toISOString(),
        status: 'DRAFT',
        creatorId, // <-- use the creatorProfile.id
      };
      console.log('[UPLOAD] Simulated content metadata:', contentMetadata);
      return NextResponse.json({
        success: true,
        message: 'Simulated upload (no AWS credentials set)',
        files: savedFiles.map(f => ({ name: f.name, size: f.size })),
        metadata: contentMetadata
      });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Process and upload files to S3
    const savedFiles: UploadedFile[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      // Upload to S3
      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      };
      await s3.send(new PutObjectCommand(uploadParams));
      const s3Url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      console.log(`[UPLOAD] Uploaded file to S3: ${s3Url}`);
      savedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        path: s3Url, // S3 URL for database
      });
    }

    // Prepare content metadata
    const contentMetadata = {
      title,
      description,
      contentType,
      price,
      contentFor,
      language,
      licensingType,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      demoLink,
      notes,
      files: savedFiles,
      uploadedAt: new Date().toISOString(),
      status: 'DRAFT',
      creatorId, // <-- use the creatorProfile.id
    };

    // TODO: Save to database when DATABASE_URL is configured
    // For now, just log the metadata
    console.log('Content uploaded successfully:', contentMetadata);

    return NextResponse.json({
      success: true,
      message: 'Content uploaded successfully',
      files: savedFiles.map(f => ({ name: f.name, size: f.size })),
      metadata: contentMetadata
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload content' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 