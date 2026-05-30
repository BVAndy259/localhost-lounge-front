import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ReceiptText,
  Armchair,
  UtensilsCrossed,
  LogOut,
  MessageSquare,
  Users,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AuthService } from "../../services/auth.service";
import { FloatingChatWidget } from "../../components/chat/FloatingChatWidget";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("lhl_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentUser] = useState(
    getStoredUser() || {
      name: "Usuario",
      email: "admin@lhl.pe",
      role: "ADMIN",
    },
  );

  useEffect(() => {
    const stopMonitoring = AuthService.startSessionMonitor(() => {
      navigate("/admin/login", { replace: true });
    });

    return stopMonitoring;
  }, [navigate]);

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const navLinks = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Reservas",
      path: "/admin/reservas",
      icon: <CalendarDays size={18} />,
    },
    {
      name: "Órdenes",
      path: "/admin/ordenes",
      icon: <ReceiptText size={18} />,
    },
    { name: "Mesas", path: "/admin/mesas", icon: <Armchair size={18} /> },
    {
      name: "Usuarios",
      path: "/admin/usuarios",
      icon: <Users size={18} />,
      adminOnly: true,
    },
    {
      name: "Meseros",
      path: "/admin/meseros",
      icon: <Users size={18} />,
    },
    {
      name: "Carta",
      path: "/admin/platos",
      icon: <UtensilsCrossed size={18} />,
      adminOnly: true,
    },
    {
      name: "Chat Interno",
      path: "/admin/chat",
      icon: <MessageSquare size={18} />,
    },
  ];

  const confirmLogout = () => {
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
            {navLinks
              .filter((link) => !link.adminOnly || currentUser.role === "ADMIN")
              .map((link) => {
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
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Panel Operativo
          </h2>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                {currentUser.role === "ADMIN" ? (
                  <ShieldCheck size={14} className="text-emerald-500" />
                ) : (
                  <ShieldAlert size={14} className="text-amber-500" />
                )}
                <p className="text-sm font-bold leading-none text-white">
                  {currentUser.name}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentUser.email}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm tracking-widest shadow-lg shadow-primary/20">
              {getInitials(currentUser.name)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-card to-background">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>

        <FloatingChatWidget variant="staff" userRole={currentUser.role} />

        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-sm rounded-sm shadow-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/20">
                <LogOut className="text-destructive" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                ¿Cerrar Sesión?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Dejarás de recibir notificaciones y alertas del sistema en este
                dispositivo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-secondary/50 hover:bg-secondary text-white rounded-sm text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-sm text-sm font-medium transition-colors"
                >
                  Sí, salir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
