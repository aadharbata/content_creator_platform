"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/generated/prisma");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new prisma_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
exports.default = prisma;
//# sourceMappingURL=prisma.js.map