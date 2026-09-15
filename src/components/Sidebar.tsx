"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  categories: string[];
  activeCategory?: string | null;
  studioMode?: boolean;
};

export default function Sidebar({ categories, activeCategory, studioMode }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function close() {
    setOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="mobile-topbar">
        <Link className="name" href="/">
          <Image src="/logo/logo-mark-white.png" alt="" width={44} height={47} priority />
          <span className="topbar-text">
            <span className="topbar-title">Eddy Mack Tour</span>
            <span className="topbar-role">
              Director &amp; Filmmaker
              <br />
              based in Venice
            </span>
          </span>
        </Link>
        <button
          className={`hamburger${open ? " open" : ""}`}
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </div>
      <div className={`backdrop${open ? " open" : ""}`} onClick={close} />
      <nav className={`sidebar${open ? " open" : ""}`}>
        <div>
          <div className="brand">
            <Link href="/" onClick={close} className="brand-mark">
              <Image src="/logo/logo-mark-white.png" alt="Eddy Mack Tour" width={56} height={60} priority />
              <span className="brand-text">
                <span className="name">Eddy Mack Tour</span>
                <span className="role">
                  Director &amp; Filmmaker
                  <br />
                  based in Venice
                </span>
              </span>
            </Link>
          </div>
          <nav className="filters">
            {studioMode ? (
              <>
                <Link href="/admin" onClick={close} className={activeCategory === undefined ? "active" : ""}>
                  Your projects
                </Link>
              </>
            ) : (
              <>
                <Link href="/" onClick={close} className={pathname === "/" && !activeCategory ? "active" : ""}>
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={`/?category=${encodeURIComponent(c)}`}
                    onClick={close}
                    className={activeCategory === c ? "active" : ""}
                  >
                    {c}
                  </Link>
                ))}
              </>
            )}
          </nav>
          {!studioMode && (
            <nav className="filters filters-secondary">
              <Link href="/about" onClick={close} className={pathname === "/about" ? "active" : ""}>
                About
              </Link>
            </nav>
          )}
        </div>
        <div className="sidebar-bottom">
          {studioMode ? (
            <button className="studio-link" onClick={logout} style={{ background: "none", cursor: "pointer" }}>
              Sign out
            </button>
          ) : (
            <Link className="studio-link" href="/admin">
              Studio
            </Link>
          )}
          {!studioMode && (
            <div className="social-links">
              <a href="https://www.instagram.com/eddymacktourprod/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@EddyMackTour/featured" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
                  <path d="M10.5 9.3v5.4l5-2.7z" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.itsnova.com/eddymacktour" target="_blank" rel="noopener noreferrer" aria-label="Nova">
                <svg viewBox="0 0 26 26" width="17" height="17" fill="currentColor">
                  <path d="M2.5 25 V4.5 h5.2 l10.6 13.6 V4.5 h5.2 V25 h-5.2 L7.7 11.4 V25 z" />
                </svg>
              </a>
            </div>
          )}
          <div className="credit">
            © {new Date().getFullYear()} Eddy Mack Tour
            <br />
            edocarraro1998@gmail.com
          </div>
        </div>
      </nav>
    </>
  );
}
