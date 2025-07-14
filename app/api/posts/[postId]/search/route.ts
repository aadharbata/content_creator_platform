import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: {params: {postId: string}}) {
    try {
        const { postId } = await context.params;
        console.log("PostId in params: ", postId);
        if (!postId){
            console.log("PostId not found");
            return NextResponse.json({message: "Post Not Found"}, {status: 404});
        }
        // Find the first postMedia for the given postId
        const media = await prisma.postMedia.findFirst({
            where: { postId },
            include: {
                post: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        id: true,
                                        profile: { select: { avatarUrl: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        if (!media) {
            return NextResponse.json({message: "Media Not Found"}, {status: 404});
        }
        const creatorUser = media.post?.creator?.user;
        const transformed = {
            id: media.id,
            creator: {
                name: creatorUser?.name || "Unknown",
                handle: `@${creatorUser?.name?.replace(/\s+/g, "") || "unknown"}`,
                avatar:
                    creatorUser?.profile?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        creatorUser?.name || "U"
                    )}&background=random`,
            },
            time: media.createdAt,
            content: media.post?.content || "",
            image: media.url,
            isPaid: media.post?.isPaidOnly || false,
            price: media.post?.isPaidOnly ? "₹" : undefined,
            likes: media.LikesCount,
            comments: undefined, // Not tracked per media
            isLiked: false, // Not tracked per media
        };
        return NextResponse.json({ success: true, media: transformed }, { status: 200 });
    } catch (error) {
        console.log("Error in searching post: ", error);
        return NextResponse.json({message: "Error in searching post"}, {status: 500});
    }
}