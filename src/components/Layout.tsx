import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/classes", label: "Classes & Schedule" },
  { to: "/events", label: "Events" },
  { to: "/news", label: "Studio News" },
  { to: "/merch", label: "Merch" },
  { to: "/contact", label: "Contact" },
];

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand">
            <img src="/logo_brand.png" alt="Santa Barbara Elemental Aerial Arts" />
          </NavLink>
          <nav>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <a className="phone" href="tel:+18053642037">(805) 364-2037</a>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <div className="container">
          <p>22 W Mission St Unit B, Santa Barbara, CA</p>
          <p>
            <a href="mailto:ElementalAerialArts@gmail.com">ElementalAerialArts@gmail.com</a>
            {" · "}
            <a href="tel:+18053642037">(805) 364-2037</a>
            {" · "}
            <a href="https://www.instagram.com/elemental_aerial_arts/">Instagram</a>
          </p>
          <p className="fine">© {new Date().getFullYear()} Santa Barbara Elemental Aerial Arts — All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
}
