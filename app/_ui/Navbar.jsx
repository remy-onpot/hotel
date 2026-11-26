"use client";
import { faBars, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import fa_styles from "@fortawesome/fontawesome-svg-core/styles.css";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import GuestDropdown from "./GuestDropdown/GuestDropdown";
import { brand } from "../_lib/brand";

function Navbar({ user, signOutAction }) {
  const [hideMenu, setHideMenu] = useState(true);
  const pathname = usePathname();
  const menuButton = useRef(null);
  const menuId = "primary-navigation";

  useEffect(() => setHideMenu(true), [pathname]);
  useEffect(() => {
    if (hideMenu) return;
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setHideMenu(true);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [hideMenu]);
  return (
    <header>
      <div className="container header-items">
        <h2>{brand.shortName}</h2>
        <nav id={menuId} className={`navbar ${hideMenu ? "hide-menu" : "show-menu"}`} aria-label="Main navigation">
          <ul>
            <li>
              <Link className={pathname === "/" ? "active" : ""} href="/" onClick={() => setHideMenu(true)}>
                Home
              </Link>
            </li>
            <li>
              <Link
                className={pathname.includes("rooms") ? "active" : ""}
                href="/rooms"
                onClick={() => setHideMenu(true)}
              >
                Rooms
              </Link>
            </li>
            {/* <li>About</li> */}
            <li>
              <Link
                href={"/contact"}
                className={pathname === "/contact" ? "active" : ""}
                onClick={() => setHideMenu(true)}
              >
                Contact Us
              </Link>
            </li>
            <li>
              {user ? (
                <GuestDropdown user={user} signOutAction={signOutAction} />
              ) : (
                <Link
                  className={pathname.includes("account") || pathname === "/signin" ? "active" : ""}
                  href="/signin"
                  onClick={() => setHideMenu(true)}
                >
                  Guest Area
                </Link>
              )}
            </li>
          </ul>
        </nav>
        <button ref={menuButton} type="button" aria-label={hideMenu ? "Open menu" : "Close menu"} aria-expanded={!hideMenu} aria-controls={menuId} onClick={() => setHideMenu(!hideMenu)} className="toggle-menu-button">
          <FontAwesomeIcon icon={hideMenu ? faBars : faClose} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
