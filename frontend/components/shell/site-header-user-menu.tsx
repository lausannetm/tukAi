"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

config.autoAddCss = false;
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { UserPublicDTO } from "@/lib/auth-types";
import { userDisplayName } from "@/lib/user-display";

type SiteHeaderUserMenuProps = {
  user: UserPublicDTO;
  onLogout: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
};

type UserMenuItem =
  | { type: "link"; href: string; label: string }
  | { type: "action"; label: string; action: "logout" };

const USER_MENU_ITEMS: UserMenuItem[] = [
  { type: "link", href: "/list-service", label: "List a service" },
  { type: "link", href: "/my-services", label: "My services" },
  { type: "link", href: "/used-services", label: "Used services" },
  { type: "action", label: "Log out", action: "logout" },
];

export function SiteHeaderUserMenu(props: SiteHeaderUserMenuProps): JSX.Element {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const displayName = userDisplayName(props.user);

  const closeMenu = useCallback((): void => {
    setOpen(false);
  }, []);

  const handleNavigate = useCallback((): void => {
    closeMenu();
    props.onNavigate?.();
  }, [closeMenu, props.onNavigate]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return (): void => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  const itemClass = props.mobile
    ? "site-header-user-menu__item site-header-user-menu__item--mobile"
    : "site-header-user-menu__item";

  return (
    <div ref={rootRef} className="site-header-user-menu">
      <button
        type="button"
        className={`site-header-user-menu__trigger${
          props.mobile ? " site-header-user-menu__trigger--mobile" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="site-header-user-menu__greeting">
          Hi, {displayName}
        </span>
        <FontAwesomeIcon icon={faUser} className="site-header-user-menu__icon" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`site-header-user-menu__panel${
            props.mobile ? " site-header-user-menu__panel--mobile" : ""
          }`}
        >
          {USER_MENU_ITEMS.map((item) => {
            if (item.type === "link") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={itemClass}
                  onClick={handleNavigate}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`${itemClass} site-header-user-menu__item--action`}
                onClick={() => {
                  handleNavigate();
                  props.onLogout();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
