"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed.ts
// import { PrismaClient } from "@prisma/client";
const prisma_1 = __importDefault(require("./lib/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fakeCourses = [
    // Paste the 10 courses array here
    {
        id: "b0a1727f-6533-46a5-a551-907dd6b26b3c",
        title: "Course Title 1",
        description: "This is a description for course 1.",
        price: 126.72,
        duration: 10,
        salesCount: 385,
        imgURL: "https://example.com/course_image_1.jpg",
        rating: 2.85,
        // authorId: "7a91be43-5cde-480e-a4ec-cf15aa186af1",
    },
    {
        id: "9dc0f80a-c7bd-4cce-aa42-8e9db3973336",
        title: "Course Title 2",
        description: "This is a description for course 2.",
        price: 142.01,
        duration: 5,
        salesCount: 66,
        imgURL: "https://example.com/course_image_2.jpg",
        rating: 2.2, // authorId: "b7b3e9e1-5f29-4b11-8077-24b2d95c0711",
    },
    {
        id: "f9e25d42-8906-4e4f-a8ed-bbcc7adca153",
        title: "Course Title 3",
        description: "This is a description for course 3.",
        price: 168.62,
        duration: 46,
        salesCount: 99,
        imgURL: "https://example.com/course_image_3.jpg",
        rating: 1.12,
        // authorId: "8bf7d8b9-0bff-4a25-81ed-1d2445340d65",
    },
    {
        id: "4f6e1dd1-423c-4add-8dcb-c63976a2c0c8",
        title: "Course Title 4",
        description: "This is a description for course 4.",
        price: 113.4,
        duration: 21,
        salesCount: 985,
        imgURL: "https://example.com/course_image_4.jpg",
        rating: 1.65,
        // authorId: "e8db893c-5b52-4ddd-a22a-e374365f15f8",
    },
    {
        id: "bb4250cb-7311-4c32-8d8e-1dd845ff2d6b",
        title: "Course Title 5",
        description: "This is a description for course 5.",
        price: 30.0,
        duration: 4,
        salesCount: 305,
        imgURL: "https://example.com/course_image_5.jpg",
        rating: 2.57,
        // authorId: "5eb59c8e-e73f-45e5-b073-1faefdfd68fa",
    },
    {
        id: "c99bceb9-3922-423a-86d9-91f7887e67da",
        title: "Course Title 6",
        description: "This is a description for course 6.",
        price: 10.84,
        duration: 39,
        salesCount: 628,
        imgURL: "https://example.com/course_image_6.jpg",
        rating: 4.02,
        // authorId: "9a52e21c-bba8-4058-bff9-aaf9bae9b2ab",
    },
    {
        id: "a5b52c70-21ed-4485-88f4-9.045571e+11",
        title: "Course Title 7",
        description: "This is a description for course 7.",
        price: 91.34,
        duration: 19,
        salesCount: 873,
        imgURL: "https://example.com/course_image_7.jpg",
        rating: 2.01,
        // authorId: "5558e8a4-a369-401b-a1b6-561aa7ad03dc",
    },
    {
        id: "fc9695c1-1d9c-41b3-81ea-30cd357ae003",
        title: "Course Title 8",
        description: "This is a description for course 8.",
        price: 197.86,
        duration: 27,
        salesCount: 420,
        imgURL: "https://example.com/course_image_8.jpg",
        rating: 3.15,
        // authorId: "cee99d16-7000-4383-a30f-80b2aeb8365b",
    },
    {
        id: "1259721b-be16-4e89-99f6-fa2ffaf73be4",
        title: "Course Title 9",
        description: "This is a description for course 9.",
        price: 105.62,
        duration: 32,
        salesCount: 327,
        imgURL: "https://example.com/course_image_9.jpg",
        rating: 1.15,
        // authorId: "11f5f001-0041-4a7c-92af-8b14a3a389c8",
    },
    {
        id: "9c06c48a-a740-4b34-b1ed-793d33580dfc",
        title: "Course Title 10",
        description: "This is a description for course 10.",
        price: 127.02,
        duration: 39,
        salesCount: 556,
        imgURL: "https://example.com/course_image_10.jpg",
        rating: 1.82,
        // authorId: "f27aedf8-edd4-444c-aaa6-f589e857d83b",
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a test author user
        const author = yield prisma_1.default.user.create({
            data: {
                name: "Test Author",
                email: "author@example.com",
                passwordHash: "hashed_password_here", // Use bcrypt in real scenarios
                role: "CREATOR",
            },
        });
        // Create courses with the author's ID
        for (const course of fakeCourses) {
            // await prisma.course.create({
            //   data: {
            //     ...course,
            // authorId: author.id, // Use the created author's ID
            //   },
            // });
            yield prisma_1.default.course.create({
                data: {
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    duration: course.duration,
                    salesCount: course.salesCount,
                    imgURL: course.imgURL,
                    rating: course.rating,
                    authorId: author.id
                },
            });
        }
        console.log("Seeded 10 courses successfully!");
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
}));
