"use client";

// import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Header from "@/frontend/components/Header";
import { translations } from "@/frontend/data/translations";
import axios from "axios";
import { Star } from "lucide-react";
// import Image from "next/image";
import React, { useEffect, useState } from "react";

interface CourseType {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  salesCount: number;
  imgURL: string;
  rating: number;
  authorId: string;
  author: string;
}

export default function ViewAll() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const fetchCourses = async () => {
    try {
      //   const res = await axios.get("http://localhost:3000/api/courses/allCourses");
      console.log("Requesting all courses");
      //   const res = await axios.get("http://localhost:3000/api/courses/allcourses");
      const res = await axios.get("/api/courses");
      console.log("Courses fetched response: ", res);
      setCourses(res.data.courses);
    } catch (error) {
      console.log("Error in fetching all courses: ", error);
      setCourses([]);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        language={language}
        setLanguage={setLanguage}
        translations={translations}
      />
      <section className="py-20 relative">
        <div
          className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
          style={{
            borderRadius: "0 0 50% 50% / 0 0 100px 100px",
            transform: "translateY(-50%)",
          }}
        ></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {courses.map((course: CourseType) => (
              <Card
                key={course.id}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={course.imgURL}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">
                          {course.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{course.author}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-blue-600">
                        ${course.price}
                      </span>
                    </div>
                  </div>
                  {/* <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>
                  {(course.students ?? 0).toLocaleString()} {t.students}
                </span>
              </div>
            </div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
