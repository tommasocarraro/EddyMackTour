import { getYoutubeEmbedUrl, getYoutubeMetadata, getYoutubeThumbnail } from "@/lib/youtube";
import { getVimeoEmbedUrl, getVimeoMetadata, normalizeVimeoUrl } from "@/lib/vimeo";

// A project's video link (stored in `Project.youtubeUrl`, named before Vimeo
// was supported) can be a YouTube or a Vimeo one; these pick the right provider.

export function isVideoUrl(url: string): boolean {
  return getVideoEmbedUrl(url) !== null;
}

export function getVideoEmbedUrl(url: string): string | null {
  return getYoutubeEmbedUrl(url) ?? getVimeoEmbedUrl(url);
}

export function normalizeVideoUrl(url: string): string {
  return normalizeVimeoUrl(url) ?? url;
}

export async function getVideoThumbnail(url: string): Promise<string | null> {
  return getYoutubeThumbnail(url) ?? (await getVimeoMetadata(url))?.thumbnail ?? null;
}

// Whatever can be looked up for the link; fields that can't be (no
// YOUTUBE_API_KEY, a private Vimeo video) come back empty for the admin to fill in.
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
  return (await getVimeoMetadata(url)) ?? { title: "", description: "", thumbnail: null };
}
