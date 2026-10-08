// Accepts vimeo.com/<id>, vimeo.com/<id>/<hash> (unlisted), channel/group paths
// ending in the id, and player.vimeo.com/video/<id>?h=<hash>.
function parseVimeoUrl(url: string): { id: string; hash: string | null } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "vimeo.com" && !parsed.hostname.endsWith(".vimeo.com")) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const idIndex = segments.findIndex((s) => /^\d+$/.test(s));
    if (idIndex === -1) return null;
    const next = segments[idIndex + 1];
    const hash = next && /^[0-9a-f]+$/i.test(next) ? next : parsed.searchParams.get("h");
    return { id: segments[idIndex], hash };
  } catch {
    return null;
  }
}

// Canonical link, without tracking/anti-bot query params Vimeo appends when a
// link is copied from the address bar. Unlisted videos keep their hash: the
// player refuses to load without it.
export function normalizeVimeoUrl(url: string): string | null {
  const video = parseVimeoUrl(url);
  if (!video) return null;
  return `https://vimeo.com/${video.id}${video.hash ? `/${video.hash}` : ""}`;
}

export function getVimeoEmbedUrl(url: string, autoplay = false): string | null {
  const video = parseVimeoUrl(url);
  if (!video) return null;
  const params = new URLSearchParams();
  if (video.hash) params.set("h", video.hash);
  if (autoplay) params.set("autoplay", "1");
  const query = params.toString();
  return `https://player.vimeo.com/video/${video.id}${query ? `?${query}` : ""}`;
}

// Vimeo has no static thumbnail URL, so title, description and thumbnail all
// come from its public oEmbed endpoint (no API key). Returns null for private
// or domain-restricted videos, which oEmbed won't describe.
export async function getVimeoMetadata(
  url: string
): Promise<{ title: string; description: string; thumbnail: string | null } | null> {
  const canonical = normalizeVimeoUrl(url);
  if (!canonical) return null;

  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(canonical)}&width=1280`
    );
    if (!res.ok) return null;

    const data = await res.json();
    return {
      title: data.title ?? "",
      description: data.description ?? "",
      thumbnail: data.thumbnail_url ?? null,
    };
  } catch {
    return null;
  }
}
