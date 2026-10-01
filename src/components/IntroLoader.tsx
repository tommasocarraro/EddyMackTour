"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "intro-seen";

// Runs inline in <body> before the page paints (see layout.tsx): once the intro
// has been dismissed in this browser session, or on Studio pages, it's hidden
// from the first frame instead of flashing up and disappearing after hydration.
export const introSeenScript = `try{if(sessionStorage.getItem("${SEEN_KEY}")||location.pathname.startsWith("/admin"))document.documentElement.dataset.introSeen=""}catch(e){}`;

// Fullscreen looping showreel shown once per browser session until the visitor
// presses "Cut to the work". The poster frame is server-rendered so it shows
// instantly; the video mounts after hydration and plays over it.
export default function IntroLoader() {
  const [stage, setStage] = useState<"shown" | "leaving" | "gone">("shown");
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.introSeen !== undefined) {
      setStage("gone");
      return;
    }
    // Reduced-motion users get the still poster instead of the moving loop.
    setPlayVideo(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  function enter() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setStage("leaving");
    setTimeout(() => setStage("gone"), 500);
  }

  if (stage === "gone") return null;

  return (
    <div
      className={`intro-loader${stage === "leaving" ? " intro-loader--out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Eddy Mack Tour showreel"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="intro-loader__media" src="/intro/intro-poster.jpg" alt="" />
      {playVideo && (
        <video className="intro-loader__media" autoPlay muted loop playsInline poster="/intro/intro-poster.jpg">
          <source src="/intro/intro-720.mp4" type="video/mp4" media="(max-width: 800px)" />
          <source src="/intro/intro-1080.webm" type="video/webm" />
          <source src="/intro/intro-1080.mp4" type="video/mp4" />
        </video>
      )}
      <div className="intro-loader__cta">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="intro-loader__logo" src="/intro/intro-logo-white.png" alt="Eddy Mack Tour" />
        <button className="intro-loader__enter" onClick={enter}>
          Cut to the work
          <span className="intro-loader__arrow" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
