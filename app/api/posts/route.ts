import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import path from "path";
import fs from "fs/promises";
import { getToken } from "next-auth/jwt";

export async function GET() {
  try {
    // Get current user from NextAuth session
    const session = await getServerSession(authOptions);
    console.log("Posts API - Session:", session);
    const currentUserId = session?.user ? (session.user as { id: string }).id : null;
    console.log("Posts API - Current user ID:", currentUserId);

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

    // Transform posts to match frontend requirements
    const transformed = posts.map((post) => {
      const creatorUser = post.creator.user;
      const isLiked = currentUserId ? post.likes.length > 0 : false;
      
      return {
        id: post.id,
        creator: {
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
        isPaid: post.isPaidOnly,
        price: post.isPaidOnly ? "₹" : undefined,
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
    // Use next-auth/jwt to get the user token from Authorization header
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
    }
    const jwtUser = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || "Ishan" });
    if (!jwtUser || typeof jwtUser.id !== 'string' || !jwtUser.id) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    // Parse form data
    const formData = await request.formData();
    console.log("FormData: ", formData.getAll("media"));
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

    // Look up creator profile by id (from form/params)
    console.log("JwtUserId: ", jwtUser);
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: jwtUser.id },
    });
    console.log("creator profile search");
    if (!creatorProfile) {
      console.log("No creator profile found")
      return NextResponse.json(
        { error: "No creator profile found for this id." },
        { status: 404 }
      );
    }
    console.log("CreatorProfile found: ", creatorProfile);

    // Compare userId from token to userId in creatorProfile
    if (jwtUser.id !== creatorProfile.userId) {
      return NextResponse.json(
        { error: "You are not authorized to post for this creator." },
        { status: 403 }
      );
    }

    // (Optional) Create the post here if you want
    // console.log("Creating Post");
    const post = await prisma.post.create({
      data: {
        title,
        content,
        creatorId: creatorProfile.id,
        isPaidOnly,
      },
    });

    const imageFile = formData.get("image") as File | null;
    console.log("Imagefile: ", imageFile);
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
        console.log("File is saved: ", filePath);
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/${fileName}`;

        const postmediares = await prisma.postMedia.create({
          data: {
            url: fileUrl,
            type: "photo",
            postId: post.id,
          },
        });

        console.log("Post media created: ", postmediares);
      } catch (error) {
        console.log("Error in saving imagefile: ", error);
      }
    }

    // console.log("Post created: ", post);

    return NextResponse.json({
      success: true,
      message: "Post validated and would be created here.",
    });
  } catch (error) {
    console.error("Error in POST /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// const imageFile = formData.get('image') as File | null;
// if (imageFile) {
//   // Save the file to /public/uploads
//   const arrayBuffer = await imageFile.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);
//   const ext = path.extname(imageFile.name) || '.jpg';
//   const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
//   const uploadDir = path.join(process.cwd(), 'public', 'uploads');
//   await fs.mkdir(uploadDir, { recursive: true });
//   const filePath = path.join(uploadDir, fileName);
//   await fs.writeFile(filePath, buffer);
//   const fileUrl = `/uploads/${fileName}`;
//   // Create PostMedia record

//   const postMediaRes = await prisma.postMedia.create({
//     data: {
//       url: fileUrl,
//       type: "photo",
//       postId: post.id
//     }
//   })
//   // console.log("Post created: ", post);
//   console.log("Post media also created: ", postMediaRes);
// }

// console.log("Post Created: ", post);
