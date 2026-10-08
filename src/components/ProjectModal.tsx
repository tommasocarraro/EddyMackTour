"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ProjectInfo, ProjectPlayer, type ProjectDetailData } from "@/components/ProjectDetail";
import { PlayerReadyContext } from "@/components/VideoPlayer";

// A project opened from the gallery: it fills the window, the video starts on
// its own and stays in view while the details scroll (see "project dialog" in
// globals.css for the two layouts). The dialog itself is static; opening and
// closing are animated by Gallery as a view transition that morphs the clicked
// card into it.
export default function ProjectModal({
  project,
  playerReady,
  onClose,
}: {
  project: ProjectDetailData;
  playerReady: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Brings the details up over the lower half of the video, their first lines
  // in view (not to their end: long ones would open on the last lines), or back
  // down if they're already up.
  function toggleInfo() {
    const scroll = scrollRef.current!;
    const up = scroll.scrollTop > 0;
    scroll.scrollTo({ top: up ? 0 : scroll.clientHeight * 0.55, behavior: "smooth" });
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={project.title} tabIndex={-1} ref={dialogRef}>
      <div className="modal-scroll" ref={scrollRef}>
        <div className="modal-bar">
          <h2 className="modal-title">{project.title}</h2>
          <button className="modal-close" aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <div className="modal-stage">
          <PlayerReadyContext.Provider value={playerReady}>
            <ProjectPlayer project={project} autoplay />
          </PlayerReadyContext.Provider>
        </div>
        <div className="modal-info">
          <button className="modal-peek" onClick={toggleInfo}>
            <span>
              {project.categories.map((c) => c.name).join(" / ")} · {project.year}
            </span>
            <span className="modal-peek-hint">
              Details
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 14l6-6 6 6" />
              </svg>
            </span>
          </button>
          <ProjectInfo project={project} />
        </div>
      </div>
    </div>
  );
}
