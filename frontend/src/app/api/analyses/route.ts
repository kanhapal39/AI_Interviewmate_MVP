import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume_id, job_description_id, user_id } = body;

    if (!resume_id || !job_description_id || !user_id) {
      return NextResponse.json(
        { detail: "resume_id, job_description_id, and user_id are required" },
        { status: 400 }
      );
    }

    // Forward to backend
    const res = await fetch(`${API_BASE}/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_id,
        job_description_id,
        user_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Analysis creation error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}