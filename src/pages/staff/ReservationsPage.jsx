import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { TableService } from "../../services/table.service";
import { ReservationService } from "../../services/reservation.service";
import {
  CalendarDays,
  Clock,
  Users,
  Check,
  Ban,
  AlertCircle,
} from "lucide-react";

export const ReservationsPage = () => {
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientPickerValue, setClientPickerValue] = useState("");

  const [formData, setFormData] = useState({
    table_id: "",
    client_name: "",
    client_last_name: "",
    client_phone_number: "",
    client_email: "",
    reservation_date: "",
    reservation_time: "",
    number_people: 2,
    notes: "",
  });

  const selectedTable = tables.find(
    (table) => String(table.id) === String(formData.table_id),
  );

  const knownClients = useMemo(() => {
    const byId = new Map();

    for (const reservation of reservations) {
      const client = reservation.client;
      if (client?.id && !byId.has(client.id)) {
        byId.set(client.id, client);
      }
    }

    return Array.from(byId.values());
  }, [reservations]);

  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("q") || "").trim().toLowerCase();
  }, [location.search]);

  const visibleReservations = useMemo(() => {
    if (!searchQuery) return reservations;

    return reservations.filter((reservation) => {
      const clientName = `${reservation.client?.name || ""} ${reservation.client?.last_name || ""}`.toLowerCase();
      const phone = (reservation.client?.phone_number || "").toLowerCase();
      const email = (reservation.client?.email || "").toLowerCase();
      const tableNumber = String(reservation.table?.table_number || reservation.table_id || "").toLowerCase();
      const status = String(reservation.status || "").toLowerCase();
      const date = String(reservation.reservation_date || "").toLowerCase();
      const id = String(reservation.id || "").toLowerCase();

      return [clientName, phone, email, tableNumber, status, date, id].some((value) =>
        value.includes(searchQuery),
      );
    });
  }, [reservations, searchQuery]);

  const buildClientPickerOption = (client) => {
    const fullName = `${client.name || ""} ${client.last_name || ""}`.trim();
    const contact = client.phone_number || client.email || "sin contacto";
    return `${client.id} - ${fullName} - ${contact}`;
  };

  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const response = await ReservationService.getAll();
      setReservations(response.data || []);
    } catch (error) {
      console.error("Error al cargar reservas:", error);
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const response = await TableService.getAll();
      setTables(response.data || []);
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, []);

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];

    setSelectedClientId("");
    setClientPickerValue("");
    setFormData({
      table_id: "",
      client_name: "",
      client_last_name: "",
      client_phone_number: "",
      client_email: "",
      reservation_date: today,
      reservation_time: "19:00",
      number_people: selectedTable?.capacity || 2,
      notes: "",
    });
  };

  useEffect(() => {
    resetForm();
  }, [tables]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "table_id") {
      const nextTable = tables.find((table) => String(table.id) === value);
      setFormData((current) => ({
        ...current,
        table_id: value,
        number_people: nextTable?.capacity || current.number_people,
      }));
      return;
    }

    if (
      name === "client_name" ||
      name === "client_last_name" ||
      name === "client_phone_number" ||
      name === "client_email"
    ) {
      setSelectedClientId("");
      setClientPickerValue("");
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleClientPickerChange = (event) => {
    const inputValue = event.target.value;
    setClientPickerValue(inputValue);

    const selectedClient = knownClients.find(
      (client) => buildClientPickerOption(client) === inputValue,
    );

    if (!selectedClient) {
      setSelectedClientId("");
      return;
    }

    setSelectedClientId(String(selectedClient.id));

    setFormData((current) => ({
      ...current,
      client_name: selectedClient.name || "",
      client_last_name: selectedClient.last_name || "",
      client_phone_number: selectedClient.phone_number || "",
      client_email: selectedClient.email || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        table_id: Number(formData.table_id),
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        number_people: Number(formData.number_people),
        notes: formData.notes.trim(),
        ...(selectedClientId
          ? { client_id: Number(selectedClientId) }
          : {
              client_data: {
                name: formData.client_name.trim(),
                last_name: formData.client_last_name.trim(),
                phone_number: formData.client_phone_number.trim(),
                email: formData.client_email.trim(),
              },
            }),
      };

      await ReservationService.create(payload);
      resetForm();
      fetchReservations();
    } catch (error) {
      console.error("Error al guardar reserva:", error);
      const backendError = error.response?.data?.error;
      const backendDetails = error.response?.data?.details;
      const detailsText = Array.isArray(backendDetails)
        ? backendDetails
            .map((item) => `${item.path?.join(".") || "campo"}: ${item.message}`)
            .join(" | ")
        : "";

      alert(
        backendError
          ? `${backendError}${detailsText ? `\n${detailsText}` : ""}`
          : "Error al procesar la reserva.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await ReservationService.updateStatus(id, newStatus);
      fetchReservations();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert(error?.response?.data?.error || "No se pudo actualizar el estado");
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || "PENDIENTE";
    switch (s) {
      case "CONFIRMADA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <Check size={12} /> Confirmada
          </span>
        );
      case "EN_CURSO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/30">
            <Users size={12} /> En curso
          </span>
        );
      case "CANCELADA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30">
            <Ban size={12} /> Cancelada
          </span>
        );
      case "COMPLETADA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/30">
            <Check size={12} /> Completada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <AlertCircle size={12} /> Pendiente
          </span>
        );
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const panelGridClass =
    "grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,1fr)] 2xl:grid-cols-[minmax(0,1.7fr)_minmax(420px,0.95fr)]";

  return (
    <section className="space-y-6 relative">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Recepción y Host
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Libro de Reservas</h2>
        </div>
      </header>

      <div className={panelGridClass}>
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          {loadingReservations ? (
            <div className="p-10 text-center text-zinc-500 animate-pulse">
              Cargando libro de reservas...
            </div>
          ) : visibleReservations.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              {searchQuery
                ? `No encontré reservas que coincidan con "${searchQuery}".`
                : "No hay reservas programadas para mostrar."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Cliente</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Mesa / Pax</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Estado</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleReservations.map((res) => {
                    const clientName = res.client
                      ? `${res.client.name} ${res.client.last_name}`
                      : "Sin cliente";
                    const tableLabel = res.table?.table_number || res.table_id || "N/A";

                    return (
                      <tr key={res.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {res.client?.phone_number || "Sin teléfono"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {res.client?.email || "Sin correo"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-white">
                              <CalendarDays size={14} className="text-muted-foreground" />
                              <span>{res.reservation_date || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Clock size={14} />
                              <span>
                                {typeof res.reservation_time === "string"
                                  ? res.reservation_time.slice(0, 5)
                                  : "--:--"}{" "}
                                hrs
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 text-white bg-secondary/50 px-2 py-1 rounded-sm border border-border">
                            <Users size={14} className="text-primary" />
                            <span className="font-bold">{tableLabel}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {res.number_people} Pax
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(res.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <select
                            className="bg-background border border-border text-xs rounded-sm px-2 py-1.5 text-muted-foreground focus:outline-none focus:border-primary cursor-pointer"
                            value={res.status || "PENDIENTE"}
                            onChange={(event) => handleStatusChange(res.id, event.target.value)}
                          >
                            <option value="PENDIENTE">Marcar Pendiente</option>
                            <option value="CONFIRMADA">Confirmar</option>
                            <option value="EN_CURSO">En curso</option>
                            <option value="CANCELADA">Cancelar</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-sm overflow-hidden h-fit">
          <div className="p-5 border-b border-border">
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Alta Rápida</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Agendar Reserva</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Mesa *
              </label>
              <select
                name="table_id"
                value={formData.table_id}
                onChange={handleInputChange}
                className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                required
                disabled={loadingTables}
              >
                <option value="">Selecciona una mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.table_number} - {table.capacity} pax
                  </option>
                ))}
              </select>
              {selectedTable && (
                <p className="text-[11px] text-emerald-500/90 font-medium">
                  Capacidad detectada: {selectedTable.capacity} personas. El valor de pax se ajusta
                  automáticamente.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Cliente existente (buscar o seleccionar)
              </label>
              <input
                type="text"
                list="known-clients-list"
                value={clientPickerValue}
                onChange={handleClientPickerChange}
                className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Escribe para filtrar por nombre, correo o teléfono"
              />
              <datalist id="known-clients-list">
                {knownClients.map((client) => (
                  <option key={client.id} value={buildClientPickerOption(client)} />
                ))}
              </datalist>
              <p className="text-[11px] text-muted-foreground">
                Si no seleccionas una sugerencia, se registrará como cliente nuevo/manual.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="client_last_name"
                  value={formData.client_last_name}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="client_phone_number"
                  value={formData.client_phone_number}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="+51 ..."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Correo *
                </label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="reservation_date"
                  value={formData.reservation_date}
                  onChange={handleInputChange}
                  min={today}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Hora *
                </label>
                <input
                  type="time"
                  name="reservation_time"
                  value={formData.reservation_time}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Cant. Personas (Pax) *
                </label>
                <input
                  type="number"
                  min="1"
                  name="number_people"
                  value={formData.number_people}
                  readOnly
                  className="w-full bg-secondary/70 border border-border text-white/90 text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-not-allowed"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Notas
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Alergias, silla de bebé, cumpleaños..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Procesando..." : "Agendar Reserva"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
