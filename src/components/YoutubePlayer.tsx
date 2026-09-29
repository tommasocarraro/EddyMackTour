"use client";

import { createContext, useContext, useState } from "react";
import Thumbnail from "@/components/Thumbnail";

// False while the project dialog is still animating open. Loading YouTube's
// player mid-animation makes the grow-out-of-the-card effect stutter, so the
// iframe is only mounted once this flips to true. Outside the dialog (the full
// project page) there's no provider and it defaults to true.
export const PlayerReadyContext = createContext(true);

export default function YoutubePlayer({ embedUrl, title, poster }: { embedUrl: string; title: string; poster: string }) {
  const ready = useContext(PlayerReadyContext);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Stands in for the player until the iframe has loaded, then it's covered */}
      <Thumbnail src={poster} alt="" className="still" />
      {ready && (
        <iframe
          src={embedUrl}
          title={title}
          className={loaded ? "is-loaded" : undefined}
          onLoad={() => setLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </>
  );
}
