import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    console.log("Like API called for post:", params.postId);
    
    const session = await getServerSession(authOptions);
    console.log("Session from getServerSession:", session);
    
    let userId: string | null = null;
    
    // Try to get user ID from session first
    if (session?.user) {
      userId = (session.user as { id: string }).id;
      console.log("User ID from session:", userId);
    } else {
      // Fallback: try to get user ID from request body
      try {
        const body = await req.json();
        userId = body.userId;
        console.log("User ID from request body:", userId);
      } catch {
        console.log("Could not parse request body");
      }
    }
    
    if (!userId) {
      console.log("No user ID found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const postId = await params.postId;

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
