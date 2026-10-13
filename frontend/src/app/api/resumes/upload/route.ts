import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const workspace_id = formData.get("workspace_id") as string;
    const user_id = formData.get("user_id") as string;

    if (!file) {
      return NextResponse.json(
        { detail: "File is required" },
        { status: 400 }
      );
    }

    if (!workspace_id || !user_id) {
      return NextResponse.json(
        { detail: "workspace_id and user_id are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      file.type !== "application/pdf" &&
      file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return NextResponse.json(
        { detail: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    backendFormData.append("workspace_id", workspace_id);
    backendFormData.append("user_id", user_id);

    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: "POST",
      body: backendFormData,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}