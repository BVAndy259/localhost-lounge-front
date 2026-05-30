import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlateService } from "../../services/plate.service";
import { FloatingChatWidget } from "../../components/chat/FloatingChatWidget";
import {
  Terminal,
  CalendarCheck,
  UtensilsCrossed,
} from "lucide-react";

export const LandingPage = () => {
  const [plates, setPlates] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchPublicMenu = async () => {
      try {
        const response = await PlateService.getPublic();
        setPlates(response.data || []);
      } catch (error) {
        console.error("Error al cargar menú:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchPublicMenu();
  }, []);

  const categories = [...new Set(plates.map((p) => p.category))];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="text-primary" size={24} />
            <span className="text-xl font-black tracking-widest uppercase text-white">
              LocalHost
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#menu"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden md:block"
            >
              Nuestra Carta
            </a>
            <Link
              to="/reservar"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden md:block"
            >
              Reservar Mesa
            </Link>
            <Link
              to="/admin/login"
              className="text-xs tracking-[0.2em] uppercase font-bold text-primary/70 hover:text-primary transition-colors border border-primary/20 px-3 py-1.5 rounded-sm"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-[80vh] text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <p className="text-primary font-bold tracking-[0.4em] uppercase text-xs sm:text-sm mb-4">
          Status: 200 OK
        </p>
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-6 max-w-4xl">
          Donde el código compila y la comida{" "}
          <span className="text-primary">nunca falla.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          El primer lounge exclusivo diseñado para mentes lógicas. Disfruta de
          coctelería de autor y gastronomía de alto nivel en un ambiente
          inspirado en el desarrollo de software.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/reservar"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
          >
            <CalendarCheck size={18} />
            Agendar un Deployment (Reserva)
          </Link>
          <a
            href="#menu"
            className="bg-secondary text-white px-8 py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all border border-border"
          >
            <UtensilsCrossed size={18} />
            Ver Documentación (Menú)
          </a>
        </div>
      </section>

      <section
        id="menu"
        className="py-20 px-6 bg-secondary/10 border-y border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
              La Carta
            </h2>
            <p className="text-muted-foreground">
              Dependencias requeridas para un buen momento.
            </p>
          </div>

          {loadingMenu ? (
            <div className="text-center text-primary animate-pulse py-10">
              Cargando base de datos gastronómica...
            </div>
          ) : plates.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border border-dashed border-border rounded-md">
              Estamos actualizando nuestra carta. Vuelve pronto.
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-xl font-bold text-primary uppercase tracking-widest border-b border-border pb-3 mb-8">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plates
                      .filter((p) => p.category === category)
                      .map((plate) => (
                        <article
                          key={plate.id}
                          className="flex gap-4 bg-card p-4 rounded-sm border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="w-24 h-24 shrink-0 bg-secondary rounded-sm overflow-hidden flex items-center justify-center border border-border">
                            {plate.image_url ? (
                              <img
                                src={plate.image_url}
                                alt={plate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UtensilsCrossed
                                size={24}
                                className="text-muted-foreground/30"
                              />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <h4 className="text-white font-bold text-base leading-tight mb-1">
                              {plate.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                              {plate.description ||
                                "Deliciosa especialidad de la casa."}
                            </p>
                            <span className="text-primary font-black mt-auto">
                              S/ {Number(plate.price).toFixed(2)}
                            </span>
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-6 relative bg-secondary/10 border-y border-border">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
            ¿Listo para tu visita?
          </h2>
          <p className="text-muted-foreground mb-8">
            Reserva tu mesa en LocalHost Lounge y asegura tu espacio.
          </p>
          <Link
            to="/reservar"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
          >
            <CalendarCheck size={20} />
            Reservar Ahora
          </Link>
        </div>
      </section>

      <footer className="bg-background border-t border-border py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Terminal className="text-primary" size={20} />
          <span className="text-lg font-black tracking-widest uppercase text-white">
            LocalHost
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LocalHost Lounge. Desarrollado con ☕ y
          React.
        </p>
      </footer>

      <FloatingChatWidget />
    </div>
  );
};
