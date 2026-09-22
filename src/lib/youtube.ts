export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

export function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

export async function getYoutubeMetadata(
  url: string
): Promise<{ title: string; description: string } | null> {
  const id = getYoutubeId(url);
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!id || !apiKey) return null;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${apiKey}`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const snippet = data.items?.[0]?.snippet;
  if (!snippet) return null;

  return { title: snippet.title ?? "", description: snippet.description ?? "" };
}
