import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const jd_text = formData.get("jd_text") as string;
    const workspace_id = formData.get("workspace_id") as string;
    const user_id = formData.get("user_id") as string;

    if (!jd_text || !workspace_id || !user_id) {
      return NextResponse.json(
        { detail: "jd_text, workspace_id, and user_id are required" },
        { status: 400 }
      );
    }

    // Forward to backend as FormData (backend expects Form data)
    const backendFormData = new FormData();
    backendFormData.append("jd_text", jd_text);
    backendFormData.append("workspace_id", workspace_id);
    backendFormData.append("user_id", user_id);

    const res = await fetch(`${API_BASE}/jds/upload`, {
      method: "POST",
      body: backendFormData,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("JD upload error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}