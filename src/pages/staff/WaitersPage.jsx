import { useEffect, useState } from "react";
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

export const WaitersPage = () => {
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWaiterId, setEditingWaiterId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
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
    fetchWaiters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = () => {
    setEditingWaiterId(null);
    setFormData({ name: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (waiter) => {
    setEditingWaiterId(waiter.id);
    setFormData({ name: waiter.name || "" });
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
        await WaiterService.update(editingWaiterId, { name: formData.name.trim() });
      } else {
        await WaiterService.create({ name: formData.name.trim() });
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Nuevo Mesero
        </button>
      </header>

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
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {waiters.map((waiter) => (
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
                            ID #{waiter.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(waiter)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-white transition-colors bg-secondary/50 px-3 py-1.5 rounded-sm border border-border"
                      >
                        <PencilLine size={14} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
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