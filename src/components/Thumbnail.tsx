"use client";

const FALLBACK = "/logo/logo-mark-white.png";

function fallBack(img: HTMLImageElement) {
  if (img.src.endsWith(FALLBACK)) return;
  img.src = FALLBACK;
  img.classList.add("thumb-fallback");
}

export default function Thumbnail({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => fallBack(e.currentTarget)}
      onLoad={(e) => {
        const img = e.currentTarget;
        // YouTube serves a 120x90 gray placeholder (HTTP 200) instead of a
        // real 404 when a video has no maxresdefault thumbnail.
        if (img.naturalWidth === 120 && img.naturalHeight === 90) {
          fallBack(img);
        }
      }}
    />
  );
}
