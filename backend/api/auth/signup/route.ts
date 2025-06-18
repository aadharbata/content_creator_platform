import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }
    // Connect to PostgreSQL
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    // Check if user exists
    const userCheck = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      await client.end();
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    // Insert user
    const result = await client.query(
      "INSERT INTO users (name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, email, role, created_at",
      [name, email, password_hash, role]
    );
    const user = result.rows[0];
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    await client.end();
    return NextResponse.json({ user, token });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Signup failed" }, { status: 500 });
  }
} 