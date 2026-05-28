import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Armchair,
  UtensilsCrossed,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";
import { AuthService } from "../../services/auth.service";

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    {
      name: "Reservas",
      path: "/admin/reservas",
      icon: <CalendarDays size={18} />,
    },
    { name: "Mesas", path: "/admin/mesas", icon: <Armchair size={18} /> },
    { name: "Meseros", path: "/admin/meseros", icon: <Users size={18} /> },
    {
      name: "Carta",
      path: "/admin/platos",
      icon: <UtensilsCrossed size={18} />,
    },
    {
      name: "Chat Interno",
      path: "/admin/chat",
      icon: <MessageSquare size={18} />,
    },
  ];

  const handleLogout = () => {
    AuthService.logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between hidden md:flex">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-widest uppercase text-white">
                LocalHost
              </span>
              <span className="text-[9px] tracking-[0.4em] uppercase text-primary">
                Lounge Staff
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Panel Operativo
          </h2>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none text-foreground">
                Admin Mode
              </p>
              <p className="text-xs text-muted-foreground mt-1">admin@lhl.pe</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-card to-background">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
