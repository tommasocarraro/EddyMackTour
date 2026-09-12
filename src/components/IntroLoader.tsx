"use client";

import { useEffect, useState } from "react";

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const fallback = setTimeout(dismiss, 1500);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setDismissing(true);
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  return (
    <div className={`intro-loader${dismissing ? " intro-loader--out" : ""}`}>
      <video
        className="intro-loader__video"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 5;
        }}
      >
        <source src="/logo/logo-intro.webm" type="video/webm" />
        <source src="/logo/logo-intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
