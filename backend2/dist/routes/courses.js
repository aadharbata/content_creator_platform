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
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = express_1.default.Router();
router.get("/topcourses", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const topCourses = yield prisma_1.default.course.findMany({
            orderBy: {
                salesCount: "desc",
            },
            take: 5,
        });
        console.log("Fetching top courses: ", topCourses);
        return res.status(200).json(topCourses);
    }
    catch (error) {
        console.log("Error in fetching top courses: ", error);
        return res.status(500).json({ message: "Error in fetching top courses" });
    }
}));
exports.default = router;
