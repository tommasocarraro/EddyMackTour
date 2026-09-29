"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ProjectDetail, { type ProjectDetailData } from "@/components/ProjectDetail";
import ProjectModal from "@/components/ProjectModal";
import Thumbnail from "@/components/Thumbnail";

export type GalleryProject = ProjectDetailData & { id: string; slug: string };

function slugFromPath(pathname: string) {
  return pathname.startsWith("/project/") ? decodeURIComponent(pathname.slice("/project/".length)) : null;
}

function findCard(slug: string) {
  return document.querySelector<HTMLElement>(`.card[data-slug="${CSS.escape(slug)}"]`);
}

// While a transition runs, the clicked card carries the names the dialog uses
// (see "card ⇄ dialog morph" in globals.css), so the browser morphs one into the
// other. Only one element may hold a name at a time, hence the hand-over inside
// the update callback.
function nameCard(card: HTMLElement | null, on: boolean) {
  if (!card) return;
  card.style.viewTransitionName = on ? "project-dialog" : "";
  const still = card.querySelector<HTMLElement>(".still");
  if (still) still.style.viewTransitionName = on ? "project-media" : "";
}

// Runs `update` inside a view transition (the browser snapshots the page before
// and after and animates between them on the compositor). Falls back to an
// instant update where unsupported or when reduced motion is requested.
function morph(kind: "open" | "close", update: () => void) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduceMotion) {
    update();
    return null;
  }
  const root = document.documentElement;
  root.dataset.vt = kind;
  const vt = document.startViewTransition(update);
  vt.finished.finally(() => {
    if (root.dataset.vt === kind) delete root.dataset.vt;
  });
  return vt;
}

// Clicking a card opens the project as a dialog straight from the data already
// on the page (no server round trip, so the open animation starts on click).
// The URL still changes to /project/[slug] via history.pushState, which Next
// keeps in sync with usePathname; back/refresh/direct visits behave as usual.
export default function Gallery({ projects }: { projects: GalleryProject[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState(() => slugFromPath(pathname));
  // False while the dialog is still morphing open; the YouTube player waits for it.
  const [settled, setSettled] = useState(true);
  const open = openSlug ? projects.find((p) => p.slug === openSlug) : undefined;
  const openSlugRef = useRef(openSlug);
  openSlugRef.current = openSlug;

  // Follow URL changes made outside the card/dialog (browser back/forward):
  // those switch instantly, without the morph. The card/dialog's own URL
  // changes land here too, after the state already matches.
  useEffect(() => {
    const slug = slugFromPath(pathname);
    if (slug === openSlugRef.current) return;
    setOpenSlug(slug);
    setSettled(true);
  }, [pathname]);

  function openProject(slug: string) {
    const card = findCard(slug);
    nameCard(card, true);
    const vt = morph("open", () => {
      nameCard(card, false);
      flushSync(() => {
        setSettled(false);
        setOpenSlug(slug);
      });
      // After the DOM swap, so Next's pathname update can't render the dialog
      // before the browser has captured the "before" snapshot.
      window.history.pushState(null, "", `/project/${slug}`);
    });
    if (vt) vt.finished.finally(() => setSettled(true));
    else setSettled(true);
  }

  function closeProject() {
    if (!openSlug) return;
    const card = findCard(openSlug);
    // Snapshot the poster rather than a playing video.
    document.querySelector<HTMLElement>(".modal .player iframe")?.style.setProperty("visibility", "hidden");
    const vt = morph("close", () => {
      flushSync(() => setOpenSlug(null));
      nameCard(card, true);
      router.back();
    });
    vt?.finished.finally(() => nameCard(card, false));
  }

  return (
    <>
      <section className="gallery">
        {projects.map((p) => (
          <Link
            key={p.id}
            className="card"
            data-slug={p.slug}
            href={`/project/${p.slug}`}
            onClick={(e) => {
              // Let modified clicks (new tab etc.) through as normal links.
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              openProject(p.slug);
            }}
          >
            <Thumbnail src={p.thumbnail} alt={p.title} className="still" />
            <div className="card-meta">
              <span className="cat">{p.categories.map((c) => c.name).join(" / ")}</span>
              <span className="title">{p.title}</span>
              <span className="year">{p.year}</span>
            </div>
          </Link>
        ))}
      </section>

      {open && (
        <ProjectModal key={open.slug} title={open.title} playerReady={settled} onClose={closeProject}>
          <ProjectDetail project={open} />
        </ProjectModal>
      )}
    </>
  );
}
