import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, type File } from 'formidable';
import path from 'path';
import fs from 'fs/promises';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: false,
  },
};

function isImageOrVideo(mimetype: string) {
  return mimetype.startsWith('image/') || mimetype.startsWith('video/');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // --- Backend authentication check ---
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const jwtSecret = process.env.JWT_SECRET || 'aadhar123';
    let jwtUser: { userId: string; role: string } | null = null;
    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token.' });
    }
    try {
      jwtUser = jwt.verify(token, jwtSecret) as { userId: string; role: string };
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Parse multipart form
    const form = new IncomingForm({
      multiples: true,
      uploadDir: './public/uploads',
      keepExtensions: true,
    });
    await fs.mkdir('./public/uploads', { recursive: true });

    const data = await new Promise<{ fields: Record<string, unknown>; files: Record<string, File | File[]> }>((resolve, reject) => {
      form.parse(req, (err: unknown, fields: unknown, files: unknown) => {
        if (err) reject(err);
        else resolve({ fields: fields as Record<string, unknown>, files: files as Record<string, File | File[]> });
      });
    });

    const title = typeof data.fields.title === 'string' ? data.fields.title : String(data.fields.title ?? '');
    const content = typeof data.fields.content === 'string' ? data.fields.content : String(data.fields.content ?? '');
    const isPaidOnly = data.fields.isPaidOnly;
    const creatorId = typeof data.fields.creatorId === 'string' ? data.fields.creatorId : String(data.fields.creatorId ?? '');
    console.log('Received creatorId from form:', creatorId);
    let files = data.files.media;
    if (!Array.isArray(files)) files = files ? [files] : [];

    // Only allow images/videos
    const allowedFiles = files.filter((file: File) => file.mimetype && isImageOrVideo(file.mimetype));

    // --- Validate required fields ---
    if (!title || !content || !creatorId) {
      return res.status(400).json({ error: 'Missing required fields: title, content, or creatorId.' });
    }

    console.log('JWT userId:', jwtUser.userId, 'role:', jwtUser.role, 'creatorId:', creatorId);
    // --- Authorization: Allow CREATORs to post for themselves, ADMINs for anyone ---
    if (jwtUser.role === 'CREATOR') {
      if (!creatorId || jwtUser.userId !== creatorId) {
        return res.status(403).json({ error: 'Creators can only post for themselves.' });
      }
    } else if (jwtUser.role === 'ADMIN') {
      // Allow
    } else {
      return res.status(403).json({ error: 'Not authorized to create post for this creator.' });
    }

    // Find creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });
    console.log('CreatorProfile lookup result:', creatorProfile);
    if (!creatorProfile) return res.status(404).json({ error: 'No creator profile' });

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        isPaidOnly: isPaidOnly === 'true' || isPaidOnly === true,
        creatorId: creatorProfile.id,
      },
    });

    // Save media
    for (const file of allowedFiles) {
      const ext = path.extname(file.originalFilename || '');
      const newName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`;
      const dest = path.join('./public/uploads', newName);
      await fs.rename(file.filepath, dest);
      const fileUrl = `uploads/${newName}`;
      const fileType = file.mimetype && file.mimetype.startsWith('image/')
        ? 'photo'
        : file.mimetype && file.mimetype.startsWith('video/')
        ? 'video'
        : null;
      if (!fileType) {
        console.error('Unsupported media type:', file.mimetype);
        continue; // skip this file
      }
      try {
        const res = await prisma.postMedia.create({
          data: {
            url: fileUrl,
            type: fileType,
            postId: post.id,
          },
        });
        console.log("Response postmedia: ", res);
      } catch (error) {
        console.log('Error in post media: ', error);
      }
    }
    return res.status(200).json({ post });
  } catch (error: unknown) {
    console.error('Error in POST /api/posts:', error);
    let message = 'Internal server error';
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return res.status(500).json({ error: message });
  }
} 