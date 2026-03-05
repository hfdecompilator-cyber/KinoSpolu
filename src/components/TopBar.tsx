import { Link, useLocation } from "react-router-dom";

function NavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      className={[
        "rounded-lg px-3 py-2 text-sm transition",
        active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function TopBar() {
  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-base font-semibold tracking-tight">
          StreamHub
        </Link>
        <div className="flex items-center gap-2">
          <NavLink to="/" label="Home" />
          <NavLink to="/create" label="Create room" />
        </div>
      </div>
    </div>
  );
}

