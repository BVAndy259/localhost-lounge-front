import { useEffect, useState } from "react";
import { AuthService } from "../../services/auth.service";
import { WaiterService } from "../../services/waiter.service";
import {
  Plus,
  X,
  PencilLine,
  User,
  ShieldCheck,
  CheckCircle2,
  Ban,
  UserCog,
} from "lucide-react";

const peruDateFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
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

const getWaiterLoadState = (tablesCount) => {

  if (tablesCount === 0) {
    return {
      label: "Libre",
      tone:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    };
  }

  if (tablesCount >= 3) {
    return {
      label: "Ocupado hoy",
      tone:
        "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }

  return {
    label: "Con mesas",
    tone:
      "border-amber-500/30 bg-amber-500/10 text-amber-500",
  };
};

export const WaitersPage = () => {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dateFilter, setDateFilter] = useState(getPeruTodayInputValue());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWaiterId, setEditingWaiterId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
  });

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      const response = await WaiterService.getAll();
      setWaiters(response.data || []);
    } catch (error) {
      console.error("Error al cargar meseros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionUser = await AuthService.getCurrentUser();
        setCurrentUser(sessionUser);
      } catch {
        try {
          const rawUser = localStorage.getItem("lhl_user");
          if (rawUser) {
            setCurrentUser(JSON.parse(rawUser));
          }
        } catch (error) {
          console.error("Error al leer usuario autenticado:", error);
        }
      }
    };

    loadSession();
    fetchWaiters();
  }, []);

  const canManageWaiters = currentUser?.role === "ADMIN";

  const filteredWaiters = waiters.map((waiter) => {
    const reservationsByDate = waiter.reservations?.filter((reservation) => {
      return getDateInputValue(reservation.reservation_date) === dateFilter;
    }) ?? [];

    const tablesByDate = Array.from(
      new Map(
        reservationsByDate.map((reservation) => [reservation.table.id, reservation.table])
      ).values()
    );

    return {
      ...waiter,
      filtered_reservations: reservationsByDate,
      filtered_tables: tablesByDate,
      filtered_tables_count: tablesByDate.length,
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = () => {
    setEditingWaiterId(null);
    setFormData({ name: "", phone_number: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (waiter) => {
    setEditingWaiterId(waiter.id);
    setFormData({ name: waiter.name || "", phone_number: waiter.phone_number || "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWaiterId(null);
  };

  const handleSubmitWaiter = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingWaiterId) {
        await WaiterService.update(editingWaiterId, { name: formData.name.trim(), phone_number: formData.phone_number?.trim() });
      } else {
        await WaiterService.create({ name: formData.name.trim(), phone_number: formData.phone_number?.trim() });
      }

      closeModal();
      fetchWaiters();
    } catch (error) {
      console.error("Error al guardar mesero:", error);
      alert(error.response?.data?.error || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (waiter) => {
    try {
      await WaiterService.toggleStatus(waiter.id, !waiter.active);
      fetchWaiters();
    } catch (error) {
      console.error("Error al cambiar estado del mesero:", error);
      alert(error.response?.data?.error || "No se pudo cambiar el estado.");
    }
  };

  return (
    <section className="space-y-6 relative">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Gestión de Personal
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Meseros
          </h2>
        </div>
        {canManageWaiters ? (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            Nuevo Mesero
          </button>
        ) : (
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Solo consulta
          </div>
        )}
      </header>

      <div className="rounded-md border border-border bg-card/50 p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-2 min-w-48">
          <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Fecha
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => setDateFilter(getPeruTodayInputValue())}
          className="rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:border-primary transition-colors"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={() => setDateFilter("")}
          className="rounded-sm border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white hover:border-primary transition-colors"
        >
          Ver todo
        </button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500 animate-pulse">
            Sincronizando meseros...
          </div>
        ) : waiters.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No hay meseros registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Mesero
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Mesas
                  </th>
                  {canManageWaiters && (
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWaiters.map((waiter) => {
                  const tablesCount = waiter.filtered_tables_count ?? 0;
                  const loadState = getWaiterLoadState(tablesCount);

                  return (
                  <tr key={waiter.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold border border-border">
                          {waiter.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            <UserCog size={14} className="text-primary" />
                            {waiter.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID #{waiter.id} · {waiter.phone_number ? (
                              <a href={`https://wa.me/${waiter.phone_number.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                WhatsApp
                              </a>
                            ) : (
                              "Sin número"
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => handleToggleStatus(waiter)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            waiter.active !== false
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                          }`}
                        >
                          {waiter.active !== false ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Ban size={12} />
                          )}
                          {waiter.active !== false ? "Activo" : "Bloqueado"}
                        </button>

                        <div className="text-xs text-muted-foreground">
                          {waiter.active !== false
                            ? tablesCount >= 3
                              ? "Llegó al límite de hoy"
                              : "Disponible para asignación"
                            : "No recibe nuevas mesas"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${loadState.tone}`}
                        >
                          {loadState.label}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {tablesCount} mesa(s) en la fecha
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {waiter.filtered_tables?.length ? (
                            waiter.filtered_tables.map((table) => (
                              <span
                                key={table.id}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                              >
                                Mesa {table.table_number} · {table.status}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sin mesas para la fecha seleccionada
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {canManageWaiters && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(waiter)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-white transition-colors bg-secondary/50 px-3 py-1.5 rounded-sm border border-border"
                        >
                          <PencilLine size={14} /> Editar
                        </button>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && canManageWaiters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h3 className="text-lg font-semibold text-white">
                {editingWaiterId ? "Editar Mesero" : "Nuevo Mesero"}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitWaiter} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Nombre del Mesero
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Ej: +51987654321"
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : editingWaiterId ? "Actualizar Mesero" : "Guardar Mesero"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};