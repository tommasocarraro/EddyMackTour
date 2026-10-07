import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createBunnyUpload, isBunnyConfigured } from "@/lib/bunny";

// Starts a video upload: the Studio then sends the file straight to Bunny Stream
// with the signed headers returned here.
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBunnyConfigured()) {
    return NextResponse.json(
      { error: "Video uploads aren't set up yet (the Bunny Stream keys are missing)." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim() || "Untitled";

  const upload = await createBunnyUpload(title);
  if (!upload) {
    return NextResponse.json({ error: "Couldn't start the upload. Try again." }, { status: 502 });
  }

  return NextResponse.json(upload, { status: 201 });
}
