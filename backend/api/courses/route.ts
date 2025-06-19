// import prisma from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server"
// // import { topCourses } from "@/frontend/data/courses"

// export async function GET(req: NextRequest) {
//   // In a real application, this would fetch from a database
//   try {
//     const topCourses = await prisma.course.findMany({
//       orderBy: {
//         salesCount: 'desc'
//       },
//       take: 5
//     });
//     console.log("Fetching top courses: ", topCourses);
//     return NextResponse.json({courses: topCourses}, {status: 200});
//   } catch (error) {
//     console.log("Error in fetching top courses: ", error);
//     return NextResponse.json({message: "Error in fetching top courses"}, {status: 500});
//   }
// }

import prisma from "../../../lib/prisma";
import express, {Request, Response} from 'express';
// const express = require("express");

const router = express.Router();

router.get("/topcourses", async (req: Request, res: Response) => {
  try {
    const topCourses = await prisma.course.findMany({
      orderBy: {
        salesCount: "desc",
      },
      take: 5,
    });
    res.status(200).json(topCourses);
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    res.status(500).json({message: "Error in fetching top courses"});
  }
});

export default router;