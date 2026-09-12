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
          <Image src="/logo/logo-mark-white.png" alt="" width={32} height={34} priority />
          <span>Eddy Mack Tour</span>
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
              <span className="name">Eddy Mack Tour</span>
            </Link>
            <span className="role">
              Director &amp; Editor
              <br />
              based in Genoa
            </span>
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
          <div className="credit">
            © {new Date().getFullYear()} Eddy Mack Tour
            <br />
            hello@eddymack.tour
          </div>
        </div>
      </nav>
    </>
  );
}
