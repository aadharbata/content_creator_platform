import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";

export async function GET(request: NextRequest) {
  try {
    // Get current user from NextAuth session first
    const session = await getServerSession(authOptions);
    let currentUserId = session?.user ? (session.user as { id: string }).id : null;
    
    // If no session, try to get user from JWT token (fallback for old token-based requests)
    if (!currentUserId) {
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      
      if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET || "Ishan";
          const jwtUser = jwt.verify(token, jwtSecret) as { userId: string; role: string };
          currentUserId = jwtUser.userId;
        } catch (jwtError) {
          // Invalid token, continue without authentication
        }
      }
    }

    // Fetch posts with creator, media, likes, and comments
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          include: {
            user: {
              select: {
                name: true,
                id: true,
                profile: {
                  select: { avatarUrl: true },
                },
              },
            },
          },
        },
        media: true,
        likes: {
          where: currentUserId ? { userId: currentUserId } : undefined,
        },
        comments: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      take: 20, // Limit to 20 posts for now
    });

    // Get user's subscriptions to check access to paid content
    const userSubscriptions = currentUserId ? await prisma.subscription.findMany({
      where: { userId: currentUserId },
      select: { creatorId: true }
    }) : [];

    const subscribedCreatorIds = new Set(userSubscriptions.map(sub => sub.creatorId));

    // Transform posts to match frontend requirements
    const transformed = posts.map((post) => {
      const creatorUser = post.creator.user;
      const isLiked = currentUserId ? post.likes.length > 0 : false;
      
      // Check if user is subscribed to this creator
      const creatorUserId = creatorUser?.id;
      const isSubscribed = creatorUserId ? subscribedCreatorIds.has(creatorUserId) : false;
      
      // Determine if post should be shown as locked
      // If post is not paidOnly, always show unlocked
      // If post is paidOnly but user is subscribed, show unlocked  
      // If post is paidOnly and user is not subscribed, show locked
      const shouldShowLocked = post.isPaidOnly && !isSubscribed;
      
      return {
        id: post.id,
        creator: {
          id: creatorUser?.id || "unknown",
          name: creatorUser?.name || "Unknown",
          handle: `@${creatorUser?.name?.replace(/\s+/g, "") || "unknown"}`,
          avatar:
            creatorUser?.profile?.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              creatorUser?.name || "U"
            )}&background=random`,
        },
        time: post.createdAt,
        content: post.content,
        image:
          post.media && post.media.length > 0 ? post.media[0].url : undefined,
        isPaid: shouldShowLocked,
        price: shouldShowLocked ? "₹" : undefined,
        likes: post._count.likes,
        comments: post._count.comments,
        isLiked: isLiked,
      };
    });

    return NextResponse.json(
      { success: true, posts: transformed },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required. Please login." },
        { status: 401 }
      );
    }

    const currentUserId = (session.user as { id: string }).id;

    // Parse form data
    const formData = await request.formData();
    const creatorId = formData.get("creatorId") as string;
    const content = formData.get("content") as string;
    const title = formData.get("title") as string;
    const isPaidOnly = formData.get("isPaidOnly") === "true";

    if (!creatorId || !content || !title) {
      return NextResponse.json(
        { error: "Missing required fields: creatorId, title, or content." },
        { status: 400 }
      );
    }

    // Look up creator profile by userId from session
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: currentUserId },
    });
    
    if (!creatorProfile) {
      console.log("No creator profile found")
      return NextResponse.json(
        { error: "No creator profile found for this user." },
        { status: 404 }
      );
    }
    console.log("CreatorProfile found: ", creatorProfile);

    // Verify the creator ID matches
    if (creatorProfile.userId !== currentUserId) {
      return NextResponse.json(
        { error: "You are not authorized to post for this creator." },
        { status: 403 }
      );
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        creatorId: creatorProfile.id,
        isPaidOnly,
      },
    });

    // Handle image upload
    const imageFile = formData.get("image") as File | null;
    if (imageFile) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = path.extname(imageFile.name) || ".jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/${fileName}`;

        await prisma.postMedia.create({
          data: {
            url: fileUrl,
            type: "photo",
            postId: post.id,
          },
        });
      } catch (error) {
        console.error("Error saving image file:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
