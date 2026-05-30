import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TableService } from "../../services/table.service";
import { ReservationService } from "../../services/reservation.service";
import { WaiterService } from "../../services/waiter.service";
import {
  Users,
  CheckCircle2,
  Ban,
  Clock,
  X,
  Plus,
  PencilLine,
} from "lucide-react";

const peruDateFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const peruTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const getDatePartsValue = (date) => {
  const parts = peruDateFormatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${year}-${month}-${day}`;
};

const getDateInputValue = (value) => {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return getDatePartsValue(value);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";

    if (ISO_DATE_RE.test(trimmedValue)) {
      return trimmedValue;
    }

    const slashMatch = trimmedValue.match(SLASH_DATE_RE);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
    }

    const datetimeMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (datetimeMatch) {
      return datetimeMatch[1];
    }

    const date = new Date(trimmedValue);
    if (!Number.isNaN(date.getTime())) {
      return getDatePartsValue(date);
    }
  }

  return "";
};

const getPeruTodayInputValue = () => getDateInputValue(new Date());

export const TablesPage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [currentRole, setCurrentRole] = useState("ADMIN");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigningWaiter, setAssigningWaiter] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [reservationWaiterSelections, setReservationWaiterSelections] = useState({});
  const [reservationDateFilter, setReservationDateFilter] = useState(
    getPeruTodayInputValue()
  );
  const [reservationHourFilter, setReservationHourFilter] = useState("");
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: 2,
    type: "NORMAL",
    reservation_price: "0",
    description: "",
  });

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await TableService.getAll();
      const nextTables = response.data || [];
      setTables(nextTables);
      return nextTables;
    } catch (error) {
      console.error("Error al cargar mesas:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchWaiters = async () => {
    setLoadingWaiters(true);
    try {
      const response = await WaiterService.getAll();
      setWaiters(response.data || []);
    } catch (error) {
      console.error("Error al cargar meseros:", error);
    } finally {
      setLoadingWaiters(false);
    }
  };

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("lhl_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        setCurrentRole(user?.role || "ADMIN");
      }
    } catch {
      setCurrentRole("ADMIN");
    }

    fetchTables();
    fetchWaiters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = () => {
    setEditingTableId(null);
    setFormData({
      table_number: "",
      capacity: 2,
      type: "NORMAL",
      reservation_price: "0",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (table) => {
    setSelectedTable(table);
    const nextSelections = {};
    table?.reservations?.forEach((reservation) => {
      nextSelections[reservation.id] = reservation.assigned_waiter?.id
        ? String(reservation.assigned_waiter.id)
        : "";
    });
    setReservationWaiterSelections(nextSelections);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (table) => {
    setEditingTableId(table.id);
    setFormData({
      table_number: table.table_number ?? "",
      capacity: table.capacity ?? 2,
      type: table.type ?? "NORMAL",
      reservation_price: table.reservation_price ?? "0",
      description: table.description ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTableId(null);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTable(null);
    setReservationWaiterSelections({});
  };

  const handleSubmitTable = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTableId) {
        await TableService.update(editingTableId, {
          capacity: Number(formData.capacity),
          type: formData.type,
          reservation_price:
            formData.reservation_price === "" ||
            formData.reservation_price === null
              ? undefined
              : Number(formData.reservation_price),
          description: formData.description,
        });
      } else {
        await TableService.create({
          table_number: formData.table_number.trim(),
          capacity: Number(formData.capacity),
          type: formData.type,
          reservation_price:
            formData.reservation_price === "" ||
            formData.reservation_price === null
              ? undefined
              : Number(formData.reservation_price),
          description: formData.description.trim() || undefined,
        });
      }

      closeModal();
      fetchTables();
    } catch (error) {
      console.error("Error al guardar la mesa:", error);
      alert("Hubo un error al guardar la mesa. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (table) => {
    try {
      await TableService.toggleActive(table.id, !table.active);
      fetchTables();
    } catch (error) {
      console.error("Error al cambiar el estado de la mesa:", error);
      alert("No se pudo cambiar el estado de la mesa. Revisa la consola.");
    }
  };

  const handleAssignReservationWaiter = async (reservationId) => {
    const waiterId = reservationWaiterSelections[reservationId];

    if (!waiterId) {
      alert("Selecciona un mesero para asignarlo a esa reserva.");
      return;
    }

    setAssigningWaiter(true);
    try {
      await ReservationService.assignWaiter(reservationId, Number(waiterId));
      const nextTables = await fetchTables();
      const updatedSelected = nextTables.find((table) => table.id === selectedTable?.id);
      if (updatedSelected) {
        setSelectedTable(updatedSelected);
      }
    } catch (error) {
      console.error("Error al asignar mesero:", error);
      alert(
        error?.response?.data?.message ||
          "No se pudo asignar el mesero a la reserva. Revisa la consola."
      );
    } finally {
      setAssigningWaiter(false);
    }
  };

  const getStatusStyles = (status) => {
    const s = status?.toUpperCase() || "LIBRE";
    switch (s) {
      case "LIBRE":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30",
          text: "text-emerald-500",
          icon: <CheckCircle2 size={16} />,
          label: "Libre",
        };
      case "OCUPADA":
        return {
          bg: "bg-destructive/10 border-destructive/30",
          text: "text-destructive",
          icon: <Ban size={16} />,
          label: "Ocupada",
        };
      case "RESERVADA":
        return {
          bg: "bg-amber-500/10 border-amber-500/30",
          text: "text-amber-500",
          icon: <Clock size={16} />,
          label: "Reservada",
        };
      default:
        return {
          bg: "bg-secondary/50 border-border",
          text: "text-muted-foreground",
          icon: <Users size={16} />,
          label: s,
        };
    }
  };

  const formatHourOnly = (value) => {
    if (!value) return "--:--";

    if (typeof value === "string") {
      const trimmedValue = value.trim();
      if (!trimmedValue) return "--:--";

      if (/^\d{2}:\d{2}/.test(trimmedValue)) {
        return trimmedValue.slice(0, 5);
      }

      const datetimeMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})[T\s].*/);
      if (datetimeMatch) {
        const date = new Date(trimmedValue);
        if (!Number.isNaN(date.getTime())) {
          return peruTimeFormatter.format(date);
        }
      }

      return trimmedValue.slice(0, 5);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "--:--";
    }

    return peruTimeFormatter.format(date);
  };

  const matchesReservationFilters = (reservation) => {
    if (!reservationDateFilter && !reservationHourFilter) return true;

    const reservationDate = getDateInputValue(reservation.reservation_date);
    const reservationHour = formatHourOnly(reservation.reservation_time);

    const matchesDate = reservationDateFilter
      ? reservationDate === reservationDateFilter
      : true;
    const matchesHour = reservationHourFilter
      ? reservationHour === reservationHourFilter
      : true;

    return matchesDate && matchesHour;
  };

  const visibleTables = tables.filter((table) => {
    if (!reservationDateFilter && !reservationHourFilter) return true;

    return table.reservations?.some(matchesReservationFilters) ?? false;
  });

  const filteredReservations =
    selectedTable?.reservations?.filter(matchesReservationFilters) ?? [];

  const availableWaiters = waiters.filter((waiter) => waiter.active !== false);

  return (
    <section className="space-y-6 relative">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Gestión de Salón
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Plano de Mesas
          </h2>
        </div>
      </header>

      <div className="rounded-md border border-border bg-card/50 p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2 min-w-48">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Día
            </label>
            <input
              type="date"
              value={reservationDateFilter}
              onChange={(event) => setReservationDateFilter(event.target.value)}
              className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2 min-w-40">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Hora
            </label>
            <input
              type="time"
              value={reservationHourFilter}
              onChange={(event) => setReservationHourFilter(event.target.value)}
              className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setReservationDateFilter("");
              setReservationHourFilter("");
            }}
            className="rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:border-primary transition-colors"
          >
            Limpiar filtros
          </button>

          {currentRole === "ADMIN" && (
            <button
              onClick={openCreateModal}
              className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              Nueva Mesa
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 animate-pulse">
          Cargando plano del salón...
        </div>
      ) : visibleTables.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-md">
          No hay mesas que coincidan con los filtros actuales.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleTables.map((table) => {
            const styles = getStatusStyles(table.status);
            const isActive = table.active !== false;

            return (
              <div
                key={table.id}
                onClick={() => openDetailModal(table)}
                className={`relative p-6 rounded-md border flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${styles.bg} ${
                  isActive ? "" : "opacity-60 grayscale"
                }`}
              >
                {currentRole === "ADMIN" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(table);
                    }}
                    className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-white transition-colors"
                  >
                    <PencilLine size={12} />
                    Editar
                  </button>
                )}

                <div className="absolute top-3 right-3 flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                  <Users size={12} />
                  {table.capacity}
                </div>

                <h3 className="text-5xl font-black text-white mt-4 mb-4 tracking-tighter">
                  {table.table_number || table.number || "0"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Capacidad: {table.capacity}
                </p>
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-[0.3em]">
                  Tipo: {table.type || "NORMAL"}
                </p>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}
                >
                  {styles.icon}
                  {styles.label}
                </div>

                {currentRole === "ADMIN" && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleActive(table);
                    }}
                    className={`mt-4 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                      isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                    }`}
                  >
                    {isActive ? "Activa" : "Inactiva"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isDetailModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
                  Detalle de Mesa
                </p>
                <h3 className="text-lg font-semibold text-white">
                  Mesa {selectedTable.table_number}
                </h3>
              </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeDetailModal}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-sm border border-border bg-secondary/30 p-3">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Estado
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedTable.status || "LIBRE"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
                      Reservas de la Mesa
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Se muestran las reservas que coinciden con los filtros de arriba.
                    </p>
                  </div>
                </div>

                {filteredReservations.length ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredReservations.map((reservation) => {
                      const clientName = reservation.client
                        ? `${reservation.client.name || ""} ${
                            reservation.client.last_name || ""
                          }`.trim()
                        : "Sin cliente";

                      return (
                        <div
                          key={reservation.id}
                          className="rounded-sm border border-border bg-background/40 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {clientName}
                              </p>
                              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-1">
                                {getDateInputValue(reservation.reservation_date) === reservationDateFilter
                                  ? "Reserva del día"
                                  : "Otra fecha"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-white">
                                {formatHourOnly(reservation.reservation_time)} hrs
                              </p>
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                {reservation.assigned_waiter?.name || "Sin mesero"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
                            {currentRole === "ADMIN" && (
                              <>
                                <div className="min-w-56 flex-1 space-y-2">
                                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                    Asignar mesero a esta hora
                                  </label>
                                  <select
                                    value={reservationWaiterSelections[reservation.id] || ""}
                                    onChange={(event) =>
                                      setReservationWaiterSelections((current) => ({
                                        ...current,
                                        [reservation.id]: event.target.value,
                                      }))
                                    }
                                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="">Selecciona un mesero</option>
                                    {availableWaiters.map((waiter) => (
                                      <option key={waiter.id} value={waiter.id}>
                                        {waiter.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAssignReservationWaiter(reservation.id)}
                                  disabled={assigningWaiter}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                  {assigningWaiter ? "Asignando..." : "Asignar"}
                                </button>
                              </>
                            )}

                            {/* No navigation to Orders or POS from Tables: order management happens in Órdenes */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-border bg-secondary/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay reservas para este día en esta mesa.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && currentRole === "ADMIN" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-white">
                {editingTableId ? "Editar Mesa" : "Registrar Nueva Mesa"}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitTable} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Identificador de Mesa
                </label>
                <input
                  type="text"
                  name="table_number"
                  value={formData.table_number}
                  onChange={handleInputChange}
                  disabled={Boolean(editingTableId)}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  placeholder="Ej: E-1 o V-1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Capacidad de Personas
                </label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Tipo de Mesa
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Precio de Reserva
                </label>
                <input
                  type="number"
                  name="reservation_price"
                  min="0"
                  step="0.01"
                  value={formData.reservation_price}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Ej: Mesa cerca de la terraza, ideal para 4 personas"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingTableId
                      ? "Actualizando..."
                      : "Registrando..."
                    : editingTableId
                      ? "Actualizar Mesa"
                      : "Guardar Mesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};