import { Terminal, MapPin, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const PublicFooter = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="text-primary" size={28} />
              <span className="text-2xl font-black tracking-widest uppercase text-white">
                LocalHost
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Un salón restaurante moderno en Arequipa.
              Donde el buen ambiente y la buena comida nunca fallan.
            </p>
            <div className="space-y-2 mt-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Cerro Colorado,
                Arequipa, Perú
              </p>
              <p className="flex items-center gap-2">
                <Clock size={16} className="text-primary" /> Lun - Sab | 18:00 -
                02:00 AM
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-primary" /> +51 987 654 321
              </p>
            </div>
          </div>

          <div className="md:pl-10 space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest mb-4">
              Directorio
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  to="/carta"
                  className="hover:text-primary transition-colors"
                >
                  La Carta
                </Link>
              </li>
              <li>
                <Link
                  to="/reservar"
                  className="hover:text-primary transition-colors"
                >
                  Reservaciones
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Políticas de Privacidad
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4 h-64 md:h-auto">
            <h4 className="text-white font-bold uppercase tracking-widest mb-2">
              Ubicación
            </h4>
            <div className="h-full min-h-50 w-full overflow-hidden rounded-sm border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15310.871891961555!2d-71.56475654999999!3d-16.38871855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91424a682845cce3%3A0x6b8eb7c8a60e0eb!2sCerro%20Colorado%2C%20Arequipa!5e0!3m2!1ses-419!2spe!4v1716300000000!5m2!1ses-419!2spe"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación LocalHost Lounge"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border my-8"></div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            © {new Date().getFullYear()} LocalHost Lounge.
          </p>
        </div>
      </div>
    </footer>
  );
};
