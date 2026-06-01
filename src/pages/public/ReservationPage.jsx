import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReservationService } from "../../services/reservation.service";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Users,
  Clock,
  User,
  Phone,
  AlignLeft,
  Info,
  Mail,
  Armchair,
} from "lucide-react";

export const ReservationPage = () => {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    guests: 2,
    reservation_date: today,
    reservation_time: "",
    table_id: "",
    selected_table_info: null,
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });

  // MAGIA DE LA IA: Intercepta los datos del chat y pre-llena el formulario
  useEffect(() => {
    let isActive = true;

    const initializeAiReservation = async () => {
      if (!location.state?.aiData) {
        window.scrollTo(0, 0);
        return;
      }

      const { aiData } = location.state;
      const suggestedTable = aiData.table_id
        ? {
            id: aiData.table_id,
            table_number: aiData.table_number || aiData.table_id,
            type: aiData.table_type || "Automática",
            capacity: aiData.table_capacity,
          }
        : null;

      if (!isActive) return;

      setFormData((prev) => ({
        ...prev,
        guests: aiData.number_people || 2,
        reservation_date: aiData.reservation_date || today,
        reservation_time: aiData.reservation_time || "",
        customer_name: aiData.customer_name || "",
        customer_email: aiData.customer_email || "",
        customer_phone: aiData.customer_phone || "",
        notes: "Reserva iniciada vía IA.",
        table_id: aiData.table_id || "",
        selected_table_info: suggestedTable,
      }));

      if (suggestedTable) {
        setStep(3); // ¡Salta directo al paso 3 de confirmación!
      } else {
        setStep(2);
        if (aiData.reservation_date && aiData.number_people) {
          try {
            const response = await ReservationService.getAvailableSlots(
              aiData.reservation_date,
              aiData.number_people,
            );

            if (isActive) {
              setAvailableSlots(response.data?.data || []);
            }
          } catch {
            if (isActive) {
              setAvailableSlots([]);
            }
          }
        }
      }

      window.history.replaceState({}, document.title); // Limpia el historial para evitar bucles
    };

    initializeAiReservation();

    return () => {
      isActive = false;
    };
  }, [location, today]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchSlots = async (e) => {
    e.preventDefault();
    setIsLoadingSlots(true);
    try {
      const response = await ReservationService.getAvailableSlots(
        formData.reservation_date,
        formData.guests,
      );
      setAvailableSlots(response.data?.data || []);
      setFormData({
        ...formData,
        reservation_time: "",
        table_id: "",
        selected_table_info: null,
      });
      setStep(2);
    } catch {
      alert("Error al buscar disponibilidad. Intente nuevamente.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSelectTime = (time) => {
    setFormData({
      ...formData,
      reservation_time: time,
      table_id: "",
      selected_table_info: null,
    });
  };

  const handleSelectTable = (table) => {
    setFormData({
      ...formData,
      table_id: table.id,
      selected_table_info: table,
    });
    setStep(3);
  };

  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ReservationService.createPublic({
        table_id: formData.table_id,
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        number_people: Number(formData.guests),
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        notes: formData.notes,
      });
      setStep(4);
    } catch (error) {
      const errorMsg = 
        error.response?.data?.error || "Error al procesar la reserva.";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-12">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center gap-2 sm:gap-4">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border transition-colors ${
              step >= num
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-transparent border-border text-muted-foreground"
            }`}
          >
            {step > num ? <CheckCircle2 size={16} /> : num}
          </div>
          {num < 3 && (
            <div
              className={`w-8 sm:w-16 h-px ${step > num ? "bg-primary" : "bg-border"}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-[85vh] py-12 px-6 max-w-4xl mx-auto animate-in fade-in duration-500 flex flex-col justify-center">
      {step < 4 && (
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider mb-3">
            Reserva tu Espacio
          </h1>
          <p className="text-muted-foreground">
            Asegura tu mesa en nuestro servidor. El proceso tomará menos de un
            minuto.
          </p>
        </div>
      )}

      {step < 4 && renderStepper()}

      <div className="bg-card border border-border p-6 sm:p-10 rounded-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

        {/* --- PASO 1 --- */}
        {step === 1 && (
          <form
            onSubmit={handleSearchSlots}
            className="space-y-8 animate-in slide-in-from-right-8 duration-300"
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-primary" /> ¿Para cuántos compilamos la
                mesa?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Número de Personas
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="number"
                      name="guests"
                      min="1"
                      max="20"
                      required
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/50 border border-border text-white text-lg rounded-sm pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Fecha de Reserva
                  </label>
                  <div className="relative">
                    <CalendarDays
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      type="date"
                      name="reservation_date"
                      min={today}
                      required
                      value={formData.reservation_date}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/50 border border-border text-white text-lg rounded-sm pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors scheme-dark"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingSlots}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm py-4 rounded-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isLoadingSlots
                ? "Consultando Servidor..."
                : "Buscar Disponibilidad"}{" "}
              <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* --- PASO 2 --- */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="text-primary" /> Horarios & Mesas
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold uppercase text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={16} /> Volver
              </button>
            </div>

            <div className="bg-secondary/30 border border-border rounded-sm p-4 mb-6 flex items-center gap-3 text-sm text-white">
              <Info className="text-primary shrink-0" size={20} />
              <p>
                Mostrando disponibilidad para{" "}
                <strong>{formData.guests} personas</strong> el{" "}
                <strong>{formData.reservation_date}</strong>.
              </p>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-sm">
                <p className="text-muted-foreground mb-4">
                  Lo sentimos, no hay mesas con capacidad suficiente para ese
                  día.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-primary font-bold text-sm uppercase tracking-widest hover:underline"
                >
                  Intentar otra fecha
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
                    1. Selecciona tu horario
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSelectTime(slot.time)}
                        className={`font-bold py-3 rounded-sm transition-all border ${
                          formData.reservation_time === slot.time
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background border-border text-white hover:border-primary hover:text-primary"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.reservation_time && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
                      2. Selecciona tu mesa
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableSlots
                        .find((s) => s.time === formData.reservation_time)
                        ?.tables.map((table) => (
                          <button
                            key={table.id}
                            onClick={() => handleSelectTable(table)}
                            className="bg-background border border-border p-4 rounded-sm text-left hover:border-primary/50 hover:shadow-lg transition-all group relative overflow-hidden"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Armchair className="text-primary" size={20} />
                              <span className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                                Mesa {table.table_number}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Zona: {table.type}
                            </p>
                            <div className="flex items-center justify-between mt-4 border-t border-border pt-3">
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Users size={14} /> {table.capacity} pax
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- PASO 3 (Al que la IA te manda pre-llenado) --- */}
        {step === 3 && (
          <form
            onSubmit={handleSubmitReservation}
            className="animate-in slide-in-from-right-8 duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="text-primary" /> Datos del Cliente
              </h2>
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold uppercase text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft size={16} /> Volver
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    name="customer_name"
                    required
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="Ej. Linus Torvalds"
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="email"
                      name="customer_email"
                      required
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="linus@linux.org"
                      className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="tel"
                      name="customer_phone"
                      required
                      minLength="7"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      placeholder="+51 987 654 321"
                      className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Notas Adicionales (Opcional)
                </label>
                <div className="relative">
                  <AlignLeft
                    className="absolute left-3 top-4 text-muted-foreground"
                    size={16}
                  />
                  <textarea
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Alergias, silla de bebé, motivo de celebración..."
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-sm text-sm text-primary mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                Resumen: <strong>{formData.guests} pax</strong> el{" "}
                <strong>{formData.reservation_date}</strong> a las{" "}
                <strong>{formData.reservation_time} hrs</strong>.
              </div>
              <div className="font-bold border border-primary/30 px-3 py-1.5 rounded-sm bg-primary/20 shrink-0">
                {formData.selected_table_info
                  ? `Mesa ${formData.selected_table_info.table_number} (${formData.selected_table_info.type})`
                  : "Mesa por confirmar"}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm py-4 rounded-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Enviando Solicitud..." : "Confirmar Reserva"}{" "}
              <CheckCircle2 size={18} />
            </button>
          </form>
        )}

        {/* --- PASO 4 --- */}
        {step === 4 && (
          <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">
              ¡Status: 201 Created!
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Tu mesa en LocalHost Lounge ha sido asegurada. Hemos enviado un
              correo de confirmación a{" "}
              <strong>{formData.customer_email}</strong>.
            </p>

            <div className="bg-secondary/50 border border-border rounded-sm p-6 inline-block text-left mb-8 space-y-2 min-w-75">
              <p className="text-sm text-white">
                <span className="text-muted-foreground w-20 inline-block">
                  Nombre:
                </span>{" "}
                <strong>{formData.customer_name}</strong>
              </p>
              <p className="text-sm text-white">
                <span className="text-muted-foreground w-20 inline-block">
                  Fecha:
                </span>{" "}
                <strong>{formData.reservation_date}</strong>
              </p>
              <p className="text-sm text-white">
                <span className="text-muted-foreground w-20 inline-block">
                  Hora:
                </span>{" "}
                <strong>{formData.reservation_time} hrs</strong>
              </p>
              <p className="text-sm text-white">
                <span className="text-muted-foreground w-20 inline-block">
                  Mesa:
                </span>{" "}
                <strong>
                  {formData.selected_table_info
                    ? `${formData.selected_table_info.table_number} (${formData.guests} pax)`
                    : "Por confirmar"}
                </strong>
              </p>
            </div>

            <div>
              <button
                onClick={() => {
                  setStep(1);
                  setFormData({
                    guests: 2,
                    reservation_date: today,
                    reservation_time: "",
                    table_id: "",
                    selected_table_info: null,
                    customer_name: "",
                    customer_email: "",
                    customer_phone: "",
                    notes: "",
                  });
                }}
                className="text-primary font-bold text-sm uppercase tracking-widest hover:underline"
              >
                Hacer otra reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
