import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/tokens", label: "Tokens" },
  { to: "/wallets", label: "Wallets" },
  { to: "/service", label: "Service" },
  { to: "/settings", label: "Settings" },
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <div>
            <div className="brand-title">Meme Tracker</div>
            <div className="brand-sub">Alert-only · No auto-trade</div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="tab-bar" aria-label="Primary">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? "tab active" : "tab")}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
