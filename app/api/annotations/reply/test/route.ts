import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { projects, clients, users, reviews, elements, comments, approvals, settings } from '@/db/schema'
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Test route received:", body);
    
    return NextResponse.json({
      status: "success",
      message: "Test route working",
      data: body
    });
  } catch (error) {
    console.error("Test route error:", error);
    return NextResponse.json(
      { status: "error", message: "Test route failed" },
      { status: 500 }
    );
  }
}
