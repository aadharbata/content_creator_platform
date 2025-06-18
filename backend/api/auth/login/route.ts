import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "pg";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }
    // Connect to PostgreSQL
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    // Find user
    const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      await client.end();
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }
    const user = result.rows[0];
    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await client.end();
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    await client.end();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Login failed" }, { status: 500 });
  }
} 