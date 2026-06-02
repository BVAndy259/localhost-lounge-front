import { useEffect } from "react";
import { Terminal, Monitor, Coffee } from "lucide-react";


export const AboutPage = () => {
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="py-20 px-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-20">
        <p className="text-xs uppercase tracking-[0.35em] text-primary mb-3">
          Nuestra esencia
        </p>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider mb-6">
          Nuestra Historia
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Nuestra Propuesta
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            En LocalHost Lounge vimos la necesidad de crear un lugar distinto
            en Arequipa: un salón restaurante moderno, cómodo y con una
            propuesta gastronómica de alta calidad.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Así nació <strong>LocalHost Lounge</strong>: un espacio ideal para
            celebrar, reunirte con amigos o disfrutar una salida especial, con
            buena atención, coctelería de autor y un ambiente que invita a
            quedarte.
          </p>
        </div>
        <div className="bg-secondary/30 border border-border p-10 rounded-sm flex min-h-75 items-center justify-center">
          <img src="https://res.cloudinary.com/dpd6ft15e/image/upload/q_auto/f_auto/v1780404816/reserva-salon-la-trastienda-800x533_lnyclj.jpg" alt="" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-8 border border-border rounded-sm">
          <Monitor className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold text-white mb-2">
            Ambiente Acogedor
          </h3>
          <p className="text-sm text-muted-foreground">
            Música agradable, iluminación cálida y un espacio cómodo para
            conversar y disfrutar cada visita.
          </p>
        </div>
        <div className="bg-card p-8 border border-border rounded-sm">
          <Coffee className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold text-white mb-2">
            Cocina de Calidad
          </h3>
          <p className="text-sm text-muted-foreground">
            Trabajamos con ingredientes seleccionados y recetas cuidadas para
            ofrecer sabores que realmente se recuerdan.
          </p>
        </div>
        <div className="bg-card p-8 border border-border rounded-sm">
          <Terminal className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold text-white mb-2">Comunidad</h3>
          <p className="text-sm text-muted-foreground">
            Nuestras puertas están abiertas para encuentros, eventos y momentos
            especiales para compartir en buena compañía.
          </p>
        </div>
      </div>
    </div>
  );
};
