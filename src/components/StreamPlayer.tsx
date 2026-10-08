"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import Thumbnail from "@/components/Thumbnail";
import { PlayerReadyContext } from "@/components/VideoPlayer";

const HIDE_CONTROLS_MS = 2600;
const SEEK_STEP_SECONDS = 5;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

// The site's own player for uploaded videos (their HLS stream on Bunny's CDN),
// with controls in the site's colours; see "stream player" in globals.css.
// YouTube/Vimeo links keep their embeds (VideoPlayer).
export default function StreamPlayer({
  src,
  title,
  poster,
  autoplay = false,
}: {
  src: string;
  title: string;
  poster: string;
  autoplay?: boolean;
}) {
  // Like the embeds, the stream only starts loading once the dialog has opened.
  const ready = useContext(PlayerReadyContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const scrubbing = useRef(false);

  const [started, setStarted] = useState(false); // first frame is on screen
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(autoplay);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  // The browser refused to autoplay with sound, so it's playing muted.
  const [silenced, setSilenced] = useState(false);
  const [idle, setIdle] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current!;
    let hls: Hls | undefined;
    let cancelled = false;

    function start() {
      if (!autoplay) return;
      video.play().catch(() => {
        video.muted = true;
        setSilenced(true);
        video.play().catch(() => setWaiting(false));
      });
    }

    // iPhones have no Media Source Extensions but play HLS natively; everything
    // else goes through hls.js.
    if (typeof MediaSource === "undefined" && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      start();
    } else {
      import("hls.js").then(({ default: HlsJs }) => {
        if (cancelled) return;
        if (!HlsJs.isSupported()) {
          video.src = src;
          start();
          return;
        }
        hls = new HlsJs({ startLevel: -1 });
        hls.on(HlsJs.Events.MANIFEST_PARSED, start);
        hls.on(HlsJs.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === HlsJs.ErrorTypes.MEDIA_ERROR) hls!.recoverMediaError();
          else setFailed(true);
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      });
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [ready, src, autoplay]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Controls fade out while it plays untouched, and come back on any movement.
  function wake() {
    setIdle(false);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused && !scrubbing.current) setIdle(true);
    }, HIDE_CONTROLS_MS);
  }
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function togglePlay() {
    const video = videoRef.current!;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    wake();
  }

  function toggleMute() {
    const video = videoRef.current!;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
    setSilenced(false);
    wake();
  }

  function seekBy(seconds: number) {
    const video = videoRef.current!;
    video.currentTime = Math.min(video.duration || 0, Math.max(0, video.currentTime + seconds));
    wake();
  }

  function toggleFullscreen() {
    const root = rootRef.current!;
    // iPhones can't put a page element in fullscreen, only the video itself
    // (in Apple's own player).
    const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    else video.webkitEnterFullscreen?.();
    wake();
  }

  function scrubTo(e: React.PointerEvent<HTMLDivElement>) {
    const video = videoRef.current!;
    if (!video.duration) return;
    const box = e.currentTarget.getBoundingClientRect();
    const time = clamp((e.clientX - box.left) / box.width) * video.duration;
    video.currentTime = time;
    setCurrent(time);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // The volume slider handles its own arrow keys.
    if (e.target instanceof HTMLInputElement) return;
    const video = videoRef.current!;
    switch (e.key) {
      case " ":
      case "k":
        // On a focused button, space already presses it.
        if (e.key === " " && e.target instanceof HTMLButtonElement) return;
        togglePlay();
        break;
      case "ArrowLeft":
        seekBy(-SEEK_STEP_SECONDS);
        break;
      case "ArrowRight":
        seekBy(SEEK_STEP_SECONDS);
        break;
      case "ArrowUp":
        video.volume = clamp(video.volume + 0.1);
        break;
      case "ArrowDown":
        video.volume = clamp(video.volume - 0.1);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        toggleFullscreen();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  const played = duration ? current / duration : 0;
  const classes = ["sp", started && "is-started", idle && playing && "is-idle"].filter(Boolean).join(" ");

  return (
    <>
      {/* Stands in for the video until its first frame is ready, then it's covered */}
      <Thumbnail src={poster} alt="" className="still" />
      <div
        className={classes}
        ref={rootRef}
        role="group"
        aria-label={title}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={wake}
        onPointerLeave={() => playing && setIdle(true)}
      >
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          onClick={() => {
            // On a touch screen the first tap only brings the controls back.
            if (idle && playing) wake();
            else togglePlay();
          }}
          onDoubleClick={toggleFullscreen}
          onLoadedData={() => setStarted(true)}
          onPlay={() => {
            setPlaying(true);
            wake();
          }}
          onPause={() => {
            setPlaying(false);
            setWaiting(false);
            setIdle(false);
          }}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onTimeUpdate={(e) => !scrubbing.current && setCurrent(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onProgress={(e) => {
            const ranges = e.currentTarget.buffered;
            if (ranges.length) setBuffered(ranges.end(ranges.length - 1));
          }}
          onVolumeChange={(e) => {
            setMuted(e.currentTarget.muted);
            setVolume(e.currentTarget.volume);
          }}
        />

        {failed ? (
          <p className="sp-message">This video can&rsquo;t be played right now.</p>
        ) : waiting ? (
          <div className="sp-spinner" role="status" aria-label="Loading" />
        ) : (
          !playing && (
            <button className="sp-big" aria-label="Play" onClick={togglePlay}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )
        )}

        {silenced && muted && (
          <button className="sp-unmute" onClick={toggleMute}>
            Tap for sound
          </button>
        )}

        <div className="sp-controls">
          <div
            className="sp-seek"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              scrubbing.current = true;
              scrubTo(e);
            }}
            onPointerMove={(e) => scrubbing.current && scrubTo(e)}
            onPointerUp={() => {
              scrubbing.current = false;
              wake();
            }}
            onPointerCancel={() => (scrubbing.current = false)}
          >
            <div className="sp-seek-track">
              <div className="sp-seek-buffered" style={{ width: `${clamp(duration ? buffered / duration : 0) * 100}%` }} />
              <div className="sp-seek-played" style={{ width: `${played * 100}%` }} />
            </div>
            <div className="sp-seek-thumb" style={{ left: `${played * 100}%` }} />
          </div>

          <div className="sp-row">
            <button className="sp-button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}
              </svg>
            </button>
            <button className="sp-button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="none" />
                {muted || volume === 0 ? <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" /> : <path d="M15.5 9a4.2 4.2 0 010 6M18 6.5a7.8 7.8 0 010 11" />}
              </svg>
            </button>
            <input
              className="sp-volume"
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              style={{ "--sp-level": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                const video = videoRef.current!;
                video.volume = Number(e.target.value);
                video.muted = video.volume === 0;
                setSilenced(false);
              }}
            />
            <span className="sp-time">
              {formatTime(current)} / {formatTime(duration)}
            </span>
            <span className="sp-gap" />
            <button
              className="sp-button"
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
              onClick={toggleFullscreen}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                {fullscreen ? (
                  <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                ) : (
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
