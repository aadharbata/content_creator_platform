import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

export async function POST(request: NextRequest) {
  try {
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Process and save files
    const savedFiles: UploadedFile[] = [];
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);
      
      // Save file to disk
      await writeFile(filePath, buffer);
      
      savedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        path: `/uploads/${fileName}` // Store relative path for database
      });
    }

    // TODO: In production, upload files to S3 or cloud storage instead of local disk
    // For now, we'll store the local file paths

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
      status: 'DRAFT'
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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 