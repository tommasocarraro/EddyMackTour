import { getYoutubeEmbedUrl, getYoutubeMetadata, getYoutubeThumbnail } from "@/lib/youtube";
import { getVimeoEmbedUrl, getVimeoMetadata, normalizeVimeoUrl } from "@/lib/vimeo";
import { getBunnyEmbedUrl, getBunnyStreamUrl, getBunnyThumbnail, normalizeBunnyUrl } from "@/lib/bunny";

// A project's video link (stored in `Project.youtubeUrl`, named before the
// other providers were supported) can be a YouTube or a Vimeo one, or the
// player URL of a file uploaded to Bunny Stream; these pick the right provider.

export type VideoProvider = "youtube" | "vimeo" | "bunny";

export function getVideoProvider(url: string): VideoProvider | null {
  if (getYoutubeEmbedUrl(url)) return "youtube";
  if (getVimeoEmbedUrl(url)) return "vimeo";
  if (getBunnyEmbedUrl(url)) return "bunny";
  return null;
}

export function isVideoUrl(url: string): boolean {
  return getVideoEmbedUrl(url) !== null;
}

// `autoplay` asks the player to start on its own. Browsers only allow that with
// sound right after a click on this site (opening a project from the gallery);
// otherwise the player starts muted or waits for a tap.
export function getVideoEmbedUrl(url: string, autoplay = false): string | null {
  return (
    getYoutubeEmbedUrl(url, autoplay) ?? getVimeoEmbedUrl(url, autoplay) ?? getBunnyEmbedUrl(url, autoplay)
  );
}

// Uploaded files only: the stream the site's own player plays. Server-side
// only (it needs the CDN hostname from the environment), so pages work it out
// and pass it down. Null for YouTube/Vimeo links, which use their embeds.
export function getVideoStreamUrl(url: string): string | null {
  return getBunnyStreamUrl(url);
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
