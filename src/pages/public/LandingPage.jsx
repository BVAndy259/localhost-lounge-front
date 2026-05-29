import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlateService } from "../../services/plate.service";
import { ReservationService } from "../../services/reservation.service";
import { Terminal, CalendarCheck, UtensilsCrossed, ChevronRight, CheckCircle2 } from "lucide-react";

export const LandingPage = () => {
  const [plates, setPlates] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  // Estados para el formulario de reserva del cliente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    reservation_date: "",
    reservation_time: "",
    guests: 2,
    notes: ""
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // El cliente crea una reserva que por defecto tu backend pondrá "PENDIENTE"
      await ReservationService.create({
        ...formData,
        guests: Number(formData.guests),
        status: "PENDIENTE"
      });
      setReservationSuccess(true);
      setFormData({ customer_name: "", customer_phone: "", reservation_date: "", reservation_time: "", guests: 2, notes: "" });
      
      // Ocultar el mensaje de éxito después de 5 segundos
      setTimeout(() => setReservationSuccess(false), 5000);
    } catch (error) {
      alert("Hubo un error al procesar tu reserva. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agrupamos los platos por categoría para mostrarlos ordenados
  const categories = [...new Set(plates.map(p => p.category))];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      
      {/* NAVBAR (Navegación Superior) */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="text-primary" size={24} />
            <span className="text-xl font-black tracking-widest uppercase text-white">LocalHost</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#menu" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden md:block">Nuestra Carta</a>
            <a href="#reservar" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden md:block">Reservar Mesa</a>
            {/* Enlace sutil para que el Staff acceda a su panel */}
            <Link to="/admin/login" className="text-xs tracking-[0.2em] uppercase font-bold text-primary/70 hover:text-primary transition-colors border border-primary/20 px-3 py-1.5 rounded-sm">
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Bienvenida) */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-[80vh] text-center overflow-hidden">
        {/* Elemento decorativo de fondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <p className="text-primary font-bold tracking-[0.4em] uppercase text-xs sm:text-sm mb-4">
          Status: 200 OK
        </p>
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-6 max-w-4xl">
          Donde el código compila y la comida <span className="text-primary">nunca falla.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          El primer lounge exclusivo diseñado para mentes lógicas. Disfruta de coctelería de autor y gastronomía de alto nivel en un ambiente inspirado en el desarrollo de software.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#reservar" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
            <CalendarCheck size={18} />
            Agendar un Deployment (Reserva)
          </a>
          <a href="#menu" className="bg-secondary text-white px-8 py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all border border-border">
            <UtensilsCrossed size={18} />
            Ver Documentación (Menú)
          </a>
        </div>
      </section>

      {/* MENÚ DIGITAL */}
      <section id="menu" className="py-20 px-6 bg-secondary/10 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">La Carta</h2>
            <p className="text-muted-foreground">Dependencias requeridas para un buen momento.</p>
          </div>

          {loadingMenu ? (
            <div className="text-center text-primary animate-pulse py-10">Cargando base de datos gastronómica...</div>
          ) : plates.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border border-dashed border-border rounded-md">
              Estamos actualizando nuestra carta. Vuelve pronto.
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-xl font-bold text-primary uppercase tracking-widest border-b border-border pb-3 mb-8">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plates.filter(p => p.category === category).map(plate => (
                      <article key={plate.id} className="flex gap-4 bg-card p-4 rounded-sm border border-border hover:border-primary/30 transition-colors">
                        {/* Foto del plato (Si existe) */}
                        <div className="w-24 h-24 shrink-0 bg-secondary rounded-sm overflow-hidden flex items-center justify-center border border-border">
                          {plate.image_url ? (
                            <img src={plate.image_url} alt={plate.name} className="w-full h-full object-cover" />
                          ) : (
                            <UtensilsCrossed size={24} className="text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <h4 className="text-white font-bold text-base leading-tight mb-1">{plate.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
                            {plate.description || "Deliciosa especialidad de la casa."}
                          </p>
                          <span className="text-primary font-black mt-auto">S/ {Number(plate.price).toFixed(2)}</span>
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

      {/* FORMULARIO DE RESERVA */}
      <section id="reservar" className="py-24 px-6 relative">
        <div className="max-w-xl mx-auto bg-card border border-border p-8 sm:p-10 rounded-sm shadow-2xl relative z-10">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Haz tu Reserva</h2>
            <p className="text-sm text-muted-foreground">Asegura tu espacio en nuestro servidor.</p>
          </div>

          {reservationSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-sm text-center animate-in zoom-in duration-300">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-emerald-500 mb-2">¡Reserva Enviada Exitosamente!</h3>
              <p className="text-sm text-white">
                Nuestro equipo de Host verificará la disponibilidad y te esperamos en la fecha indicada. ¡Gracias por elegir LocalHost!
              </p>
            </div>
          ) : (
            <form onSubmit={handleReservationSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tu Nombre Completo</label>
                <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Ej. Linus Torvalds" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Teléfono Celular</label>
                  <input type="tel" name="customer_phone" required value={formData.customer_phone} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="+51 999 888 777" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Personas (Pax)</label>
                  <input type="number" name="guests" min="1" max="20" required value={formData.guests} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Fecha</label>
                  <input type="date" name="reservation_date" required value={formData.reservation_date} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Hora</label>
                  <input type="time" name="reservation_time" required value={formData.reservation_time} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Solicitudes Especiales (Opcional)</label>
                <textarea name="notes" rows="2" value={formData.notes} onChange={handleInputChange} className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Alergias, celebración especial..." />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm py-4 rounded-sm transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50">
                {isSubmitting ? "Procesando..." : "Confirmar Reserva"} <ChevronRight size={18} />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-border py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Terminal className="text-primary" size={20} />
          <span className="text-lg font-black tracking-widest uppercase text-white">LocalHost</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LocalHost Lounge. Desarrollado con ☕ y React.
        </p>
      </footer>

    </div>
  );
};