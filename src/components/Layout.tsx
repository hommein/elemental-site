import { useEffect, useState } from "react";
import { me, onUser, type User } from "../lib/user";
import { NavLink, Outlet } from "react-router-dom";

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
  useEffect(() => { me().then(setUserState); return onUser(setUserState); }, []);
  return (
    <>
      <header className="bg-ea-paper border-b border-ea-accent-soft/50">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:gap-2">
          <NavLink to="/" className="shrink-0">
            <img src="/logo_brand.png" alt="Santa Barbara Elemental Aerial Arts" className="h-[92px] w-auto max-md:h-16" />
          </NavLink>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to} to={l.to} end={l.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide no-underline transition-colors hover:text-ea-brown ${
                    isActive ? "text-ea-brown underline underline-offset-8 decoration-ea-accent" : "text-ea-espresso"}`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <NavLink to="/account" className="text-sm font-medium text-ea-espresso no-underline hover:text-ea-brown">
              {user ? user.name.split(" ")[0] : "Sign In"}
            </NavLink>
            <a href="tel:+18053642037" className="text-sm font-semibold text-ea-espresso no-underline max-md:hidden">(805) 364-2037</a>
          </div>
        </div>
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
