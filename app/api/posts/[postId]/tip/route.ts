import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    console.log("Postid from params: ", postId);
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization") ||
      "";
    console.log("AuthHeadrs in tipping: ", authHeader);
    // const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    console.log("Token from authheader: ", token);
    const jwtSecret = process.env.jwtsecret || "Ishan";
    let userId: string | null | undefined = undefined;
    if (token) {
      try {
        const jwtUser = jwt.verify(token, jwtSecret) as {
          userId: string;
          role?: string;
        };
        userId = jwtUser.userId;
        console.log("UserId from jwtUser: ", userId);
      } catch (error) {
        console.log("Error in jwtuser verify:", error);
        if (error instanceof jwt.TokenExpiredError) {
          return NextResponse.json({ error: "JWT expired" }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid JWT" }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
