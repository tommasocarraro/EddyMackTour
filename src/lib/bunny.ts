// Bunny Stream hosts videos uploaded from the Studio. Unlike YouTube/Vimeo there's
// no public page for a video: it only exists as this embedded player, on the
// domains allowed in the library's security settings. A project stores it as the
// player URL (in `Project.youtubeUrl`, like the other providers).

const API = "https://video.bunnycdn.com";
const PLAYER_HOSTS = ["player.mediadelivery.net", "iframe.mediadelivery.net"];
const UPLOAD_VALID_SECONDS = 24 * 60 * 60;

function parseBunnyUrl(url: string): { libraryId: string; videoId: string } | null {
  try {
    const parsed = new URL(url);
    if (!PLAYER_HOSTS.includes(parsed.hostname)) return null;
    const [kind, libraryId, videoId] = parsed.pathname.split("/").filter(Boolean);
    if ((kind !== "embed" && kind !== "play") || !/^\d+$/.test(libraryId ?? "")) return null;
    if (!/^[0-9a-f-]{36}$/i.test(videoId ?? "")) return null;
    return { libraryId, videoId };
  } catch {
    return null;
  }
}

function bunnyUrl(libraryId: string, videoId: string): string {
  return `https://${PLAYER_HOSTS[0]}/embed/${libraryId}/${videoId}`;
}

export function getBunnyVideoId(url: string): string | null {
  return parseBunnyUrl(url)?.videoId ?? null;
}

export function normalizeBunnyUrl(url: string): string | null {
  const video = parseBunnyUrl(url);
  return video ? bunnyUrl(video.libraryId, video.videoId) : null;
}

// Bunny's player autoplays unless told not to; YouTube's and Vimeo's don't.
export function getBunnyEmbedUrl(url: string, autoplay = false): string | null {
  const canonical = normalizeBunnyUrl(url);
  return canonical ? `${canonical}?autoplay=${autoplay}` : null;
}

// The video's HLS stream on the library's CDN, which the site's own player
// (`StreamPlayer`) plays instead of embedding Bunny's. The library's allowed
// domains guard these files too: any other referrer, or none, gets a 403.
export function getBunnyStreamUrl(url: string): string | null {
  const video = parseBunnyUrl(url);
  const hostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  if (!video || !hostname) return null;
  return `https://${hostname}/${video.videoId}/playlist.m3u8`;
}

// Bunny picks a frame once the video has been processed; until then this URL
// 404s and the site shows its fallback image.
export function getBunnyThumbnail(url: string): string | null {
  const video = parseBunnyUrl(url);
  const hostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  if (!video || !hostname) return null;
  return `https://${hostname}/${video.videoId}/thumbnail.jpg`;
}

function getLibrary(): { libraryId: string; apiKey: string } | null {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  return libraryId && apiKey ? { libraryId, apiKey } : null;
}

export function isBunnyConfigured(): boolean {
  return getLibrary() !== null;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export type BunnyUpload = {
  videoId: string;
  url: string;
  endpoint: string;
  headers: Record<string, string>;
};

// Creates an empty video and signs a resumable (tus) upload for it, so the
// browser can send the file straight to Bunny without the API key and without
// the file passing through this server.
export async function createBunnyUpload(title: string): Promise<BunnyUpload | null> {
  const library = getLibrary();
  if (!library) return null;

  const res = await fetch(`${API}/library/${library.libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: library.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) return null;

  const videoId: string | undefined = (await res.json()).guid;
  if (!videoId) return null;

  const expires = Math.floor(Date.now() / 1000) + UPLOAD_VALID_SECONDS;
  return {
    videoId,
    url: bunnyUrl(library.libraryId, videoId),
    endpoint: `${API}/tusupload`,
    headers: {
      AuthorizationSignature: await sha256Hex(`${library.libraryId}${library.apiKey}${expires}${videoId}`),
      AuthorizationExpire: String(expires),
      VideoId: videoId,
      LibraryId: library.libraryId,
    },
  };
}

export async function deleteBunnyVideo(videoId: string): Promise<boolean> {
  const library = getLibrary();
  if (!library) return false;

  try {
    const res = await fetch(`${API}/library/${library.libraryId}/videos/${videoId}`, {
      method: "DELETE",
      headers: { AccessKey: library.apiKey },
    });
    return res.ok;
  } catch {
    return false;
  }
}
