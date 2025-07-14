import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    console.log("Like API called for post:", postId);
    
    // Try to get user from session (cookie-based auth)
    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    
    if (session?.user) {
      const sessionUser = session.user as { id?: string; role?: string };
      userId = sessionUser.id || null;
      console.log("User ID from session:", userId);
    } else {
      // Fallback to Authorization header (token-based auth)
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token) {
        return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
      }
      const jwtUser = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'Ishan' });
      if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
        return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
      }
      userId = jwtUser.id;
      console.log("User ID from token:", userId);
    }
    
    if (!userId) {
      console.log("No user ID found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post - use transaction to ensure consistency
      await prisma.$transaction([
        // Delete the like
        prisma.like.delete({
          where: {
            userId_postId: {
              userId: userId,
              postId: postId,
            },
          },
        }),
        // Decrease likes count in all PostMedia records for this post
        prisma.$executeRaw`UPDATE "PostMedia" SET "LikesCount" = "LikesCount" - 1 WHERE "postId" = ${postId}`
      ]);

      return NextResponse.json({
        action: "unliked",
        message: "Post unliked successfully",
      });
    } else {
      // Like the post - use transaction to ensure consistency
      const [like] = await prisma.$transaction([
        // Create the like
        prisma.like.create({
          data: {
            userId: userId,
            postId: postId,
          },
        }),
        // Increase likes count in all PostMedia records for this post
        prisma.$executeRaw`UPDATE "PostMedia" SET "LikesCount" = "LikesCount" + 1 WHERE "postId" = ${postId}`
      ]);

      return NextResponse.json({
        action: "liked",
        like,
        message: "Post liked successfully",
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
