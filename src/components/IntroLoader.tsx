"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "intro-shown";

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const fallback = setTimeout(dismiss, 3000);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setDismissing(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  return (
    <div className={`intro-loader${dismissing ? " intro-loader--out" : ""}`}>
      <video
        ref={videoRef}
        className="intro-loader__video"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 3;
        }}
      >
        <source src="/logo/logo-intro.webm" type="video/webm" />
        <source src="/logo/logo-intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
