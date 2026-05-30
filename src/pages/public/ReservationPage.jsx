import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ReservationService } from "../../services/reservation.service";
import {
  Terminal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  ArrowLeft,
  Table2,
} from "lucide-react";

const STEPS = [
  { key: "guests", label: "Personas", icon: Users },
  { key: "date", label: "Fecha", icon: Calendar },
  { key: "time", label: "Hora y Mesa", icon: Clock },
  { key: "details", label: "Tus datos", icon: User },
  { key: "confirm", label: "Confirmar", icon: CheckCircle2 },
];

const MIN_DATE = new Date().toISOString().split("T")[0];

export const ReservationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleGuestsNext = () => {
    if (guests < 1 || guests > 20) return;
    goNext();
  };

  const handleDateNext = async () => {
    if (!date) return;
    setLoadingSlots(true);
    setError("");
    try {
      const slots = await ReservationService.getAvailableSlots(date, guests);
      setAvailableSlots(slots);
      setTime("");
      if (slots.length === 0) {
        setError("No hay horarios disponibles para esa fecha. Intenta con otra fecha.");
        return;
      }
      goNext();
    } catch (e) {
      setError("Error al consultar horarios disponibles. Intenta de nuevo.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTimeNext = () => {
    if (!time || !selectedTable) return;
    goNext();
  };

  const handleSelectTime = (slotTime) => {
    setTime(slotTime);
    const slot = availableSlots.find((s) => s.time === slotTime);
    if (slot?.tables?.length > 0) {
      setSelectedTable(slot.tables[0]);
    } else {
      setSelectedTable(null);
    }
  };

  const handleDetailsNext = () => {
    if (!name.trim() || !phone.trim()) return;
    goNext();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await ReservationService.createPublic({
        reservation_date: date,
        reservation_time: time,
        number_people: guests,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Error al crear la reserva. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-card border border-border p-10 rounded-sm shadow-2xl text-center">
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-3">¡Reserva Enviada!</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Nuestro equipo verificará la disponibilidad y te confirmaremos pronto.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Terminal className="text-primary" size={24} />
            <span className="text-xl font-black tracking-widest uppercase text-white">LocalHost</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-lg mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
            Reserva tu Mesa
          </h1>
          <p className="text-sm text-muted-foreground">
            Paso {step + 1} de {STEPS.length - 1}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                <s.icon size={14} />
              </div>
              {i < STEPS.length - 2 && (
                <div className={`w-6 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border p-8 sm:p-10 rounded-sm shadow-2xl">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <Users size={40} className="text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">¿Cuántos serán?</h2>
                <p className="text-sm text-muted-foreground">Selecciona la cantidad de personas</p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="w-12 h-12 rounded-full bg-secondary border border-border text-white text-xl font-bold hover:bg-secondary/80 transition-colors"
                >
                  -
                </button>
                <span className="text-5xl font-black text-white w-20 text-center">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(20, g + 1))}
                  className="w-12 h-12 rounded-full bg-secondary border border-border text-white text-xl font-bold hover:bg-secondary/80 transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {guests === 1 ? "1 persona" : `${guests} personas`}
              </p>
              <button
                onClick={handleGuestsNext}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-4"
              >
                Siguiente <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Calendar size={40} className="text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">¿Qué día?</h2>
                <p className="text-sm text-muted-foreground">Elige la fecha para tu reserva</p>
              </div>
              <input
                type="date"
                value={date}
                min={MIN_DATE}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary/50 border border-border text-white text-lg rounded-sm px-4 py-4 focus:outline-none focus:border-primary transition-colors text-center"
              />
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 bg-secondary text-white py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
                >
                  <ChevronLeft size={18} /> Atrás
                </button>
                <button
                  onClick={handleDateNext}
                  disabled={!date || loadingSlots}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loadingSlots ? "Consultando..." : "Siguiente"} <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock size={40} className="text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">¿A qué hora y qué mesa?</h2>
                <p className="text-sm text-muted-foreground">Selecciona un horario y luego una mesa disponible</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Horarios disponibles</p>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => handleSelectTime(slot.time)}
                      className={`py-3 rounded-sm text-xs font-semibold transition-colors border relative ${
                        time === slot.time
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-white border-border hover:border-primary/50"
                      }`}
                    >
                      {slot.time}
                      <span className="block text-[9px] opacity-60 mt-0.5">
                        {slot.tables?.length || 0} mesa(s)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {time && selectedTable && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Mesas disponibles a las {time}</p>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                    {availableSlots
                      .find((s) => s.time === time)
                      ?.tables?.map((table) => (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => setSelectedTable(table)}
                          className={`p-3 rounded-sm text-left transition-colors border ${
                            selectedTable?.id === table.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 text-white border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="font-bold text-sm block">Mesa {table.table_number}</span>
                          <span className="text-[10px] opacity-70 block mt-1">{table.type} · {table.capacity} pax</span>
                          <span className="text-[10px] opacity-70 block">S/ {Number(table.reservation_price).toFixed(2)}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 bg-secondary text-white py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
                >
                  <ChevronLeft size={18} /> Atrás
                </button>
                <button
                  onClick={handleTimeNext}
                  disabled={!time || !selectedTable}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <User size={40} className="text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">Tus datos</h2>
                <p className="text-sm text-muted-foreground">Para confirmar la reserva</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Nombre completo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej. Linus Torvalds"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="+51 999 888 777"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Comentarios (opcional)
                </label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Alergias, celebración especial..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 bg-secondary text-white py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
                >
                  <ChevronLeft size={18} /> Atrás
                </button>
                <button
                  onClick={handleDetailsNext}
                  disabled={!name.trim() || !phone.trim()}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Revisar <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 size={40} className="text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-1">Confirma tu reserva</h2>
                <p className="text-sm text-muted-foreground">Revisa los datos antes de enviar</p>
              </div>
              <div className="bg-secondary/30 border border-border rounded-sm p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personas</span>
                  <span className="text-white font-semibold">{guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="text-white font-semibold">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora</span>
                  <span className="text-white font-semibold">{time}</span>
                </div>
                {selectedTable && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mesa</span>
                    <span className="text-white font-semibold">Mesa {selectedTable.table_number} · {selectedTable.type}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="text-white font-semibold">{name}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Teléfono</span>
                    <span className="text-white font-semibold">{phone}</span>
                  </div>
                  {notes && (
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Comentarios</span>
                      <span className="text-white font-semibold text-right max-w-[60%]">{notes}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex-1 bg-secondary text-white py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
                >
                  <ChevronLeft size={18} /> Editar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Enviando..." : "Confirmar Reserva"} <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};