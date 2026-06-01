import { useEffect } from "react";
import { Calendar, Users, Rocket } from "lucide-react";

export const EventsPage = () => {
  useEffect(() => window.scrollTo(0, 0), []);

  const events = [
    {
      date: "Viernes, 28 de Mayo",
      title: "Noche de Música en Vivo",
      desc: "Disfruta una velada con música en vivo, cocteles de autor y el mejor ambiente para compartir.",
      icon: <Users className="text-primary" size={24} />,
    },
    {
      date: "Sábado, 05 de Junio",
      title: "Cena Maridaje de la Casa",
      desc: "Una experiencia especial con platos seleccionados y bebidas recomendadas por nuestro equipo.",
      icon: <Rocket className="text-primary" size={24} />,
    },
    {
      date: "Todos los Martes",
      title: "Tardes de Café y Conversación",
      desc: "Un espacio tranquilo para reunirte, conversar y disfrutar nuestras opciones de café y postres.",
      icon: <Calendar className="text-primary" size={24} />,
    },
  ];

  return (
    <div className="py-20 px-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-20">
        <p className="text-xs uppercase tracking-[0.35em] text-primary mb-3">
          Próximos eventos
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-6">
          Comunidad & Eventos
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          LocalHost Lounge es un punto de encuentro para disfrutar buena
          comida, música y experiencias especiales. Revisa nuestros próximos
          eventos y separa tu lugar.
        </p>
      </div>

      <div className="space-y-6">
        {events.map((ev, i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row bg-card border border-border rounded-sm p-6 md:p-8 hover:border-primary/50 transition-colors gap-6 items-start md:items-center"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-secondary/50 rounded-full shrink-0 border border-border">
              {ev.icon}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {ev.date}
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-2">
                {ev.title}
              </h3>
              <p className="text-muted-foreground text-sm">{ev.desc}</p>
            </div>
            <div className="shrink-0">
              <button className="bg-secondary hover:bg-secondary/80 text-white px-6 py-3 rounded-sm text-sm font-bold uppercase tracking-wider border border-border transition-colors">
                Reservar lugar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
