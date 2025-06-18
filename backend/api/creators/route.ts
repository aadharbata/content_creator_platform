import { NextResponse } from "next/server"
import { topCreators } from "@/frontend/data/creators"

export async function GET(request: Request) {
  // In a real application, this would fetch from a database
  return NextResponse.json({ creators: topCreators })
}
