"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, readStoredUser } from "@/lib/auth-storage";
import type { UserPublicDTO } from "@/lib/auth-types";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/list-service", label: "List service" },
  { href: "/order", label: "Order" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [storedUser, setStoredUser] = useState<UserPublicDTO | null>(null);

  useEffect(() => {
    setStoredUser(readStoredUser());
  }, [pathname]);

  const closeMenu = useCallback((): void => {
    setMenuOpen(false);
  }, []);

  const handleLogout = useCallback((): void => {
    clearAuthSession();
    setStoredUser(null);
    closeMenu();
    router.push("/");
  }, [closeMenu, router]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="bg-white surface-section border-bottom-1 surface-border sticky top-0 z-5 shadow-1">
      <div className="bg-white flex align-items-center justify-content-between px-3 sm:px-4 py-3 max-w-screen-xl mx-auto">
        <Link
          href="/"
          className="flex align-items-center gap-2 no-underline text-color font-bold text-xl"
          onClick={closeMenu}
        >
          <img
            src="/images/logo.png"
            alt=""
            width={32}
            height={30}
            className="site-header-logo"
            decoding="async"
          />
          <span>TukAI</span>
        </Link>

        <nav
          className="hidden sm:flex align-items-center gap-1 flex-wrap justify-content-end"
          aria-label="Main"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 border-round no-underline text-sm font-medium transition-colors transition-duration-150 ${
                  active
                    ? "bg-primary text-primary-contrast"
                    : "text-color hover:surface-hover"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {storedUser ? (
            <>
              <span
                className="px-2 text-sm text-color-secondary max-w-12rem white-space-nowrap overflow-hidden text-overflow-ellipsis"
                title={storedUser.email}
              >
                {storedUser.email}
              </span>
              <button
                type="button"
                className="px-3 py-2 border-round text-sm font-medium border-none surface-ground cursor-pointer text-color hover:surface-hover"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`px-3 py-2 border-round no-underline text-sm font-medium transition-colors transition-duration-150 ${
                  isActivePath(pathname, "/login")
                    ? "bg-primary text-primary-contrast"
                    : "text-color hover:surface-hover"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`px-3 py-2 border-round no-underline text-sm font-medium transition-colors transition-duration-150 ${
                  isActivePath(pathname, "/register")
                    ? "bg-primary text-primary-contrast"
                    : "text-color hover:surface-hover"
                }`}
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="sm:hidden flex align-items-center justify-content-center w-3rem h-3rem border-none border-round surface-ground cursor-pointer text-color"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <i className={`pi text-xl ${menuOpen ? "pi-times" : "pi-bars"}`} />
        </button>
      </div>

      {menuOpen ? (
        <div
          id="site-mobile-menu"
          className="sm:hidden border-top-1 surface-border surface-section shadow-2"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="flex flex-column p-2 gap-1" aria-label="Main mobile">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-3 border-round no-underline font-medium ${
                    active
                      ? "bg-primary text-primary-contrast"
                      : "text-color hover:surface-hover"
                  }`}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
            {storedUser ? (
              <>
                <span className="px-3 py-2 text-sm text-color-secondary">
                  {storedUser.email}
                </span>
                <button
                  type="button"
                  className="px-3 py-3 border-round text-left font-medium border-none surface-ground cursor-pointer text-color hover:surface-hover"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-3 border-round no-underline font-medium ${
                    isActivePath(pathname, "/login")
                      ? "bg-primary text-primary-contrast"
                      : "text-color hover:surface-hover"
                  }`}
                  onClick={closeMenu}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`px-3 py-3 border-round no-underline font-medium ${
                    isActivePath(pathname, "/register")
                      ? "bg-primary text-primary-contrast"
                      : "text-color hover:surface-hover"
                  }`}
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
