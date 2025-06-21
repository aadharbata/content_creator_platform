"use strict";
// import express from 'express';
// import bcrypt from 'bcrypt';
// import { Jwt } from 'jsonwebtoken';
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
// // const express = require('express');
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const Brand = require('../models/Brand');
// require('dotenv').config();
// const router = express.Router();
// // Creator/Fan Signup
// router.post('/creator-fan/signup', async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     if (!name || !email || !password || !role) {
//       return return res.status(400).json({ message: 'All fields are required.' });
//     }
//     const existing = await User.findOne({ email });
//     if (existing) return return res.status(400).json({ message: 'Email already exists.' });
//     const hashed = await bcrypt.hash(password, 10);
//     const user = new User({ name, email, password: hashed, role });
//     await user.save();
//     return res.status(201).json({ message: 'User registered successfully.' });
//   } catch (err) {
//     return res.status(500).json({ message: 'Server error.' });
//   }
// });
// // Brand Signup
// router.post('/brand/signup', async (req, res) => {
//   try {
//     const { gstNumber, companyName, brandName, contactPerson, email, password, industry } = req.body;
//     if (!brandName || !contactPerson || !email || !password || !industry) {
//       return return res.status(400).json({ message: 'All fields are required.' });
//     }
//     const existing = await Brand.findOne({ email });
//     if (existing) return return res.status(400).json({ message: 'Email already exists.' });
//     const hashed = await bcrypt.hash(password, 10);
//     const brand = new Brand({ gstNumber, companyName, brandName, contactPerson, email, password: hashed, industry });
//     await brand.save();
//     return res.status(201).json({ message: 'Brand registered successfully.' });
//   } catch (err) {
//     return res.status(500).json({ message: 'Server error.' });
//   }
// });
// // Login (for both User and Brand)
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     let user = await User.findOne({ email });
//     let type = 'user';
//     if (!user) {
//       user = await Brand.findOne({ email });
//       type = 'brand';
//     }
//     if (!user) return return res.status(400).json({ message: 'Invalid credentials.' });
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return return res.status(400).json({ message: 'Invalid credentials.' });
//     const payload = { id: user._id, type };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
//     res.json({ token, type });
//   } catch (err) {
//     return res.status(500).json({ message: 'Server error.' });
//   }
// });
// module.exports = router;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../dist/lib/generated/prisma");
const prisma_2 = __importDefault(require("../lib/prisma"));
// import prisma from "../../../lib/prisma";
// import { Role } from "../../../lib/generated/prisma";
const router = express_1.default.Router();
router.post("/creator-fan/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("req.body.data: ", req.body.data);
    console.log("req.body: ", req.body);
    console.log("Database URL: ", process.env.DATABASE_URL);
    try {
        const { name, email, password, role, } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (role != prisma_1.Role.CONSUMER)
            return res
                .status(400)
                .json({ message: "This route is only for consumer signup" });
        const existing = yield prisma_2.default.user.findUnique({
            where: {
                email: email,
            },
        });
        if (existing)
            return res.status(400).json({ message: "Email already exists." });
        const hashed = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma_2.default.user.create({
            data: {
                name: name,
                email: email,
                passwordHash: hashed,
                role: role,
            },
        });
        console.log("Registered User: ", user);
        return res.status(201).json({ message: "User registered successfully." });
    }
    catch (error) {
        console.log("Error in signup: ", error);
        return res.status(500).json({ message: "Server error." });
    }
}));
router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // let user = await User.findOne({ email });
        let user = yield prisma_2.default.user.findUnique({
            where: {
                email: email,
            },
        });
        let type = "user";
        // if (!user) {
        //   user = await Brand.findOne({ email });
        //   type = 'brand';
        // }
        if (!user)
            return res.status(400).json({ message: "Invalid credentials." });
        if (!(user === null || user === void 0 ? void 0 : user.passwordHash))
            return res
                .status(500)
                .json({ message: "Hashed password is not present to compare" });
        const isMatch = yield bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials." });
        const payload = { id: user === null || user === void 0 ? void 0 : user.id, type };
        const token = jsonwebtoken_1.default.sign(payload, "ISHAN", { expiresIn: "7d" });
        res.status(200).json({ token, type });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error." });
    }
}));
exports.default = router;
