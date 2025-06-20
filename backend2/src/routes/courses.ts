import express from "express";
import prisma from "../lib/prisma";

const router = express.Router();

router.get("/topcourses", async (req, res) => {
  try {
    const topCourses = await prisma.course.findMany({
      orderBy: {
        salesCount: "desc",
      },
      take: 5,
    });
    console.log("Fetching top courses: ", topCourses);
    return res.status(200).json(topCourses);
  } catch (error) {
    console.log("Error in fetching top courses: ", error);
    return res.status(500).json({message: "Error in fetching top courses"});
  }
});

export default router;