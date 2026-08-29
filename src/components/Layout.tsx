import { useEffect, useState } from "react";
import { me, onUser, type User } from "../lib/user";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/classes", label: "Classes & Schedule" },
  { to: "/events", label: "Events" },
  { to: "/news", label: "Studio News" },
  { to: "/merch", label: "Merch" },
  { to: "/contact", label: "Contact" },
];

export default function Layout() {
  const [user, setUserState] = useState<User>(null);
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { me().then(setUserState); return onUser(setUserState); }, []);
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium tracking-wide no-underline transition-colors hover:text-ea-brown ${
      isActive ? "text-ea-brown underline underline-offset-8 decoration-ea-accent" : "text-ea-espresso"}`;
  return (
    <>
      <header className="bg-ea-paper border-b border-ea-accent-soft/50 sticky top-0 z-40 md:static">
        <div className="max-w-[1100px] mx-auto px-6 py-3 max-md:px-4 max-md:py-2 flex items-center justify-between gap-4">
          <NavLink to="/" className="shrink-0">
            <img src="/logo_brand.png" alt="Santa Barbara Elemental Aerial Arts" className="h-[92px] w-auto max-md:h-12" />
          </NavLink>
          {/* desktop nav */}
          <nav className="hidden md:flex flex-wrap justify-center gap-x-5 gap-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <NavLink to="/account" className="text-sm font-medium text-ea-espresso no-underline hover:text-ea-brown">
              {user ? user.name.split(" ")[0] : "Sign In"}
            </NavLink>
            <a href="tel:+18053642037" className="text-sm font-semibold text-ea-espresso no-underline">(805) 364-2037</a>
          </div>
          {/* mobile: account + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <NavLink to="/account" className="text-sm font-medium text-ea-espresso no-underline">
              {user ? user.name.split(" ")[0] : "Sign In"}
            </NavLink>
            <button
              aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}
              onClick={() => setOpen(o => !o)}
              className="w-10 h-10 grid place-items-center rounded-lg border border-ea-accent-soft/60 text-ea-espresso"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open
                  ? <><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></>
                  : <><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></>}
              </svg>
            </button>
          </div>
        </div>
        {/* mobile dropdown */}
        {open && (
          <nav className="md:hidden border-t border-ea-accent-soft/40 bg-ea-paper px-4 pb-4 pt-2 flex flex-col shadow-lg">
            {links.map((l) => (
              <NavLink
                key={l.to} to={l.to} end={l.to === "/"}
                className={({ isActive }) =>
                  `py-3 border-b border-ea-accent-soft/25 no-underline font-medium ${
                    isActive ? "text-ea-brown" : "text-ea-espresso"}`}
              >{l.label}</NavLink>
            ))}
            <a href="tel:+18053642037" className="py-3 text-sm font-semibold text-ea-espresso no-underline">Call / text (805) 364-2037</a>
          </nav>
        )}
      </header>
      <main><Outlet /></main>
      <footer className="bg-ea-espresso text-ea-paper text-center">
        <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-2">
          <p>22 W Mission St Unit B, Santa Barbara, CA</p>
          <p className="space-x-1">
            <a className="text-ea-cream hover:text-ea-gold" href="mailto:ElementalAerialArts@gmail.com">ElementalAerialArts@gmail.com</a>
            <span>·</span>
            <a className="text-ea-cream hover:text-ea-gold" href="tel:+18053642037">(805) 364-2037</a>
            <span>·</span>
            <a className="text-ea-cream hover:text-ea-gold" href="https://www.instagram.com/elemental_aerial_arts/">Instagram</a>
          </p>
          <p className="text-xs opacity-70">© {new Date().getFullYear()} Santa Barbara Elemental Aerial Arts — All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
}
