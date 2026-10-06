"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { PlayerReadyContext } from "@/components/VideoPlayer";

// The dialog itself is static; opening and closing are animated by Gallery as a
// view transition that morphs the clicked card into it (see globals.css).
export default function ProjectModal({
  title,
  playerReady,
  onClose,
  children,
}: {
  title: string;
  playerReady: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  function close() {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose();
  }

  // Layout effect so the scroll lock is already in the "after" snapshot.
  useLayoutEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current!.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={dialogRef}>
        <div className="modal-scroll">
          <button className="modal-close" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
          <h2 className="modal-title">{title}</h2>
          <PlayerReadyContext.Provider value={playerReady}>{children}</PlayerReadyContext.Provider>
        </div>
      </div>
    </div>
  );
}
