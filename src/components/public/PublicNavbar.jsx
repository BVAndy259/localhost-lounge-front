import { Link, useLocation } from "react-router-dom";
import { Terminal, CalendarCheck } from "lucide-react";

export const PublicNavbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Nosotros", path: "/nosotros" },
    { name: "La Carta", path: "/carta" },
    { name: "Comunidad", path: "/comunidad" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Terminal
            className="text-primary group-hover:text-primary/80 transition-colors"
            size={24}
          />
          <span className="text-xl font-black tracking-widest uppercase text-white">
            LocalHost
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.path) ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <Link
            to="/reservar"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            <CalendarCheck size={16} /> Reservar
          </Link>
        </div>
      </div>
    </nav>
  );
};
