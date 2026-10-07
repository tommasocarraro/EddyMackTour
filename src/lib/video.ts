import { getYoutubeEmbedUrl, getYoutubeMetadata, getYoutubeThumbnail } from "@/lib/youtube";
import { getVimeoEmbedUrl, getVimeoMetadata, normalizeVimeoUrl } from "@/lib/vimeo";
import { getBunnyEmbedUrl, getBunnyThumbnail, normalizeBunnyUrl } from "@/lib/bunny";

// A project's video link (stored in `Project.youtubeUrl`, named before the
// other providers were supported) can be a YouTube or a Vimeo one, or the
// player URL of a file uploaded to Bunny Stream; these pick the right provider.

export function isVideoUrl(url: string): boolean {
  return getVideoEmbedUrl(url) !== null;
}

export function getVideoEmbedUrl(url: string): string | null {
  return getYoutubeEmbedUrl(url) ?? getVimeoEmbedUrl(url) ?? getBunnyEmbedUrl(url);
}

export function normalizeVideoUrl(url: string): string {
  return normalizeVimeoUrl(url) ?? normalizeBunnyUrl(url) ?? url;
}

export async function getVideoThumbnail(url: string): Promise<string | null> {
  return (
    getYoutubeThumbnail(url) ?? getBunnyThumbnail(url) ?? (await getVimeoMetadata(url))?.thumbnail ?? null
  );
}

// Whatever can be looked up for the link; fields that can't be (no
// YOUTUBE_API_KEY, a private Vimeo video, an uploaded file, which has no title
// or description of its own) come back empty for the admin to fill in.
export async function getVideoMetadata(
  url: string
): Promise<{ title: string; description: string; thumbnail: string | null }> {
  const youtubeThumbnail = getYoutubeThumbnail(url);
  if (youtubeThumbnail) {
    const metadata = await getYoutubeMetadata(url);
    return {
      title: metadata?.title ?? "",
      description: metadata?.description ?? "",
      thumbnail: youtubeThumbnail,
    };
  }
  if (normalizeBunnyUrl(url)) {
    return { title: "", description: "", thumbnail: getBunnyThumbnail(url) };
  }
  return (await getVimeoMetadata(url)) ?? { title: "", description: "", thumbnail: null };
}
