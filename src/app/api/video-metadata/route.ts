import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getVideoMetadata, isVideoUrl, normalizeVideoUrl } from "@/lib/video";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!isVideoUrl(url)) {
    return NextResponse.json({ error: "That doesn't look like a YouTube or Vimeo link." }, { status: 400 });
  }

  // Anything that can't be looked up comes back empty and the admin types it
  // in (or uploads a thumbnail) by hand.
  return NextResponse.json({ url: normalizeVideoUrl(url), ...(await getVideoMetadata(url)) });
}
