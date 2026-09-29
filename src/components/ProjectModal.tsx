"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const OPEN_MS = 900;
const CLOSE_MS = 380;
// Slight overshoot on open, so the dialog "pops" out of its tile like
// Instagram's press-and-hold preview.
const OPEN_EASING = "cubic-bezier(0.3, 1.25, 0.5, 1)";
const CLOSE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const BACKDROP_OPEN = { backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(12px)" };
const BACKDROP_CLOSED = { backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px)" };

function findCard(slug: string) {
  return document.querySelector<HTMLElement>(`.card[data-slug="${CSS.escape(slug)}"]`);
}

// Keyframe that places the dialog exactly over the card: uniformly scaled so it
// covers the card, then clipped down to the card's shape. Clip-path is in the
// dialog's own (unscaled) coordinates, hence the division by the scale.
function frameOverCard(modal: HTMLElement, card: HTMLElement): Keyframe {
  const m = modal.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  const scale = Math.max(c.width / m.width, c.height / m.height);
  const dx = c.left + c.width / 2 - (m.left + m.width / 2);
  const dy = c.top + c.height / 2 - (m.top + m.height / 2);
  const insetY = (m.height - c.height / scale) / 2;
  const insetX = (m.width - c.width / scale) / 2;
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
    clipPath: `inset(${insetY}px ${insetX}px)`,
  };
}

// The resting frame clips well outside the box so the drop shadow isn't cut off.
const FRAME_OPEN: Keyframe = { transform: "translate(0px, 0px) scale(1)", clipPath: "inset(-140px -140px)" };

export default function ProjectModal({
  slug,
  title,
  children,
}: {
  slug: string;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLImageElement>(null);
  const closingRef = useRef(false);

  // Grow the dialog out of the clicked gallery card.
  useLayoutEffect(() => {
    const overlay = overlayRef.current!;
    const modal = dialogRef.current!;
    const ghost = ghostRef.current!;
    const card = findCard(slug);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.focus({ preventScroll: true });

    if (reduceMotion) {
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }

    overlay.animate([BACKDROP_CLOSED, BACKDROP_OPEN], { duration: OPEN_MS * 0.6, easing: "ease-out" });

    if (card) {
      const still = card.querySelector<HTMLImageElement>("img");
      if (still) {
        ghost.src = still.currentSrc || still.src;
        ghost.className = `modal-ghost ${still.className}`;
      }
      modal.animate([frameOverCard(modal, card), FRAME_OPEN], { duration: OPEN_MS, easing: OPEN_EASING });
      ghost.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }], {
        duration: OPEN_MS,
        fill: "forwards",
      });
      // The dialog "is" the card while open.
      card.style.visibility = "hidden";
    } else {
      // No card on screen (e.g. navigated from elsewhere): plain pop-in.
      modal.animate(
        [
          { opacity: 0, transform: "scale(0.92)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: OPEN_MS * 0.6, easing: OPEN_EASING },
      );
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (card) card.style.visibility = "";
    };
  }, [slug]);

  // Shrink back into the card, then navigate back.
  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const overlay = overlayRef.current;
    const modal = dialogRef.current;
    const ghost = ghostRef.current;
    const card = findCard(slug);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!overlay || !modal || !ghost || reduceMotion) {
      router.back();
      return;
    }

    // Settle any open animation still running so we measure the resting layout.
    modal.getAnimations().forEach((a) => a.cancel());

    overlay.animate([BACKDROP_OPEN, BACKDROP_CLOSED], { duration: CLOSE_MS, easing: "ease-in", fill: "forwards" });

    let anim: Animation;
    if (card && ghost.getAttribute("src")) {
      anim = modal.animate([FRAME_OPEN, frameOverCard(modal, card)], {
        duration: CLOSE_MS,
        easing: CLOSE_EASING,
        fill: "forwards",
      });
      ghost.getAnimations().forEach((a) => a.cancel());
      ghost.animate([{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1, offset: 0.75 }, { opacity: 1 }], {
        duration: CLOSE_MS,
        fill: "forwards",
      });
    } else {
      anim = modal.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.92)" },
        ],
        { duration: 220, easing: "ease-in", fill: "forwards" },
      );
    }
    anim.finished.then(() => router.back());
  }, [router, slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
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
          {children}
        </div>
        {/* Copy of the card's thumbnail, cross-faded so the tile appears to become the dialog */}
        <img ref={ghostRef} className="modal-ghost" aria-hidden="true" />
      </div>
    </div>
  );
}
