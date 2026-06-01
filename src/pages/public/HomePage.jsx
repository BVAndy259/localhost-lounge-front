import { Link } from "react-router-dom";
import { ChevronRight, Code2, UtensilsCrossed, Users } from "lucide-react";

export const HomePage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center animate-in fade-in duration-700 py-20 px-6">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-100 w-100 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <p className="text-primary font-bold tracking-[0.4em] uppercase text-xs mb-4">
            Bienvenidos
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
            Donde el buen ambiente y la comida{" "}
            <span className="text-primary">nunca falla.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un salón restaurante en Arequipa pensado para quienes disfrutan
            comer bien, conversar y pasar un gran momento.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/nosotros"
            className="bg-card border border-border p-8 rounded-sm hover:border-primary/50 hover:-translate-y-2 transition-all group"
          >
            <Code2 size={32} className="text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">
              Nuestra Historia
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Conoce cómo nació LocalHost Lounge y la esencia de nuestro salón
              restaurante.
            </p>
            <span className="text-primary text-sm font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
              Explorar <ChevronRight size={16} />
            </span>
          </Link>

          <Link
            to="/carta"
            className="bg-card border border-border p-8 rounded-sm hover:border-primary/50 hover:-translate-y-2 transition-all group"
          >
            <UtensilsCrossed size={32} className="text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">
              Nuestra Carta
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Explora nuestra carta de cocina fusión y coctelería de autor.
            </p>
            <span className="text-primary text-sm font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver Menú <ChevronRight size={16} />
            </span>
          </Link>

          <Link
            to="/comunidad"
            className="bg-card border border-border p-8 rounded-sm hover:border-primary/50 hover:-translate-y-2 transition-all group"
          >
            <Users size={32} className="text-primary mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">
              Comunidad & Eventos
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Disfruta nuestras noches temáticas, música en vivo y eventos
              especiales para compartir.
            </p>
            <span className="text-primary text-sm font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
              Descubrir <ChevronRight size={16} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
