import { useEffect, useState } from "react";
import { TableService } from "../../services/table.service";
import {
  Users,
  CheckCircle2,
  Ban,
  Clock,
  X,
  Plus,
  PencilLine,
} from "lucide-react";

export const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
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
      setTables(response.data || []);
    } catch (error) {
      console.error("Error al cargar mesas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Nueva Mesa
        </button>
      </header>

      {loading ? (
        <div className="text-zinc-500 animate-pulse">
          Cargando plano del salón...
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-md">
          El salón está vacío. Registra tu primera mesa para comenzar.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const styles = getStatusStyles(table.status);
            const isActive = table.active !== false;

            return (
              <div
                key={table.id}
                className={`relative p-6 rounded-md border flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${styles.bg} ${
                  isActive ? "" : "opacity-60 grayscale"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEditModal(table)}
                  className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground hover:text-white transition-colors"
                >
                  <PencilLine size={12} />
                  Editar
                </button>

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

                <button
                  type="button"
                  onClick={() => handleToggleActive(table)}
                  className={`mt-4 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                  }`}
                >
                  {isActive ? "Activa" : "Inactiva"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
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
