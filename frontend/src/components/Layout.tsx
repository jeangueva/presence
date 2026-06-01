import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { AuroraBackground } from "./AuroraBackground";
import { UnverifiedEmailBanner } from "./UnverifiedEmailBanner";

export const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const initial =
    user?.full_name?.trim().charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "P";

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold px-3 py-1.5 rounded-xl transition ${
      isActive
        ? "bg-warm-light text-warm-plum"
        : "text-warm-olive hover:text-warm-plum hover:bg-warm-fog"
    }`;

  return (
    <div className="min-h-full flex flex-col relative">
      <AuroraBackground />
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-warm-sand/70">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          <Link to="/app" className="font-serif text-2xl text-warm-plum shrink-0">
            Presence
          </Link>
          <nav className="flex items-center gap-1 flex-1" data-tour="main-nav">
            <NavLink to="/app" end className={navLinkClass} data-tour="nav-vaults">
              Memory Vaults
            </NavLink>
            <NavLink to="/app/legacy" className={navLinkClass} data-tour="nav-legacy">
              Mi legado
            </NavLink>
          </nav>
          {user && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full bg-warm-accent/10 text-warm-accent font-bold text-sm flex items-center justify-center"
                title={user.email}
              >
                {initial}
              </div>
              <span className="hidden sm:inline text-sm text-warm-olive">
                {user.email}
              </span>
              <Link
                to="/app/settings"
                className="text-warm-olive hover:text-warm-accent transition p-1"
                aria-label="Ajustes"
                title="Ajustes"
                data-tour="settings-icon"
              >
                <SettingsIcon size={18} />
              </Link>
              <button
                onClick={onLogout}
                className="text-warm-olive hover:text-warm-accent transition p-1"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>
      <UnverifiedEmailBanner />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
};
