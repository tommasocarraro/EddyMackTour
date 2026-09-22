import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getYoutubeMetadata, getYoutubeThumbnail } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const thumbnail = getYoutubeThumbnail(url);
  if (!thumbnail) {
    return NextResponse.json({ error: "That doesn't look like a YouTube link." }, { status: 400 });
  }

  // Title/description need YOUTUBE_API_KEY; without it (or on a lookup miss) we
  // still return the thumbnail, which needs no key, and let the admin type the
  // rest in by hand.
  const metadata = await getYoutubeMetadata(url);

  return NextResponse.json({
    title: metadata?.title ?? "",
    description: metadata?.description ?? "",
    thumbnail,
  });
}
