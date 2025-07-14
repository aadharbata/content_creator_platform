import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    console.log("Postid from params: ", postId);
    
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
      console.log("AuthHeadrs in tipping: ", authHeader);
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

    const body = await req.json();
    const { tipAmount } = body;

    if (!tipAmount || typeof tipAmount !== "number" || tipAmount <= 0) {
      console.log("Invalid tip amount");
      return NextResponse.json({ message: "Invalid tip amount" }, {status: 400});
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post Not Found" }, { status: 404 });
    }

    const tipRes = await prisma.tip.create({
      data: {
        userId,
        postId,
        amount: tipAmount,
      },
    });

    const totalTip = await prisma.tip.aggregate({
        where: {postId},
        _sum: {
            amount: true
        }
    })

    console.log("TipResponse: ", tipRes);
     // Payment Functionality


    return NextResponse.json({message: "Tip sent successfully", totalTipAmount: totalTip._sum.amount}, {status: 200});
  } catch (error) {
    console.log("Error in tipping post request: ", error);
    return NextResponse.json(
      { message: "Error in sending tip" },
      { status: 500 }
    );
  }
}
