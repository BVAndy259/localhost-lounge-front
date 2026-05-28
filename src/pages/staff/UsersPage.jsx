import { useEffect, useState } from "react";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";
import {
  Plus,
  X,
  PencilLine,
  ShieldCheck,
  User,
  ShieldAlert,
  CheckCircle2,
  Ban,
} from "lucide-react";

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", 
    role: "RECEPCIONISTA",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await UserService.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionUser = await AuthService.getCurrentUser();
        setCurrentUser(sessionUser);
      } catch (error) {
        try {
          const rawUser = localStorage.getItem("lhl_user");
          if (rawUser) {
            setCurrentUser(JSON.parse(rawUser));
          }
        } catch (localStorageError) {
          console.error("Error al leer usuario autenticado:", localStorageError);
        }
      }
    };

    loadSession();
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({ name: "", email: "", password: "", role: "RECEPCIONISTA" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend = { ...formData };

      if (editingUserId && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUserId) {
        await UserService.update(editingUserId, dataToSend);
      } else {
        await UserService.create(dataToSend);
      }

      closeModal();
      fetchUsers();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert(
        error.response?.data?.error || "Error al conectar con el servidor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await UserService.toggleStatus(user.id, !user.active);
      fetchUsers();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  return (
    <section className="space-y-6 relative">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Seguridad y Acceso
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Personal del Sistema
          </h2>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </header>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500 animate-pulse">
            Sincronizando credenciales...
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 font-semibold tracking-wider">
                    Rol de Acceso
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold border border-border">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.role === "ADMIN" ? (
                          <ShieldCheck size={16} className="text-emerald-500" />
                        ) : (
                          <User size={16} className="text-primary" />
                        )}
                        <span className="font-medium text-white">
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={
                          (currentUser?.role === "ADMIN" &&
                            currentUser?.id === user.id &&
                            user.active !== false) ||
                          (user.role === "ADMIN" &&
                            currentUser?.role === "ADMIN" &&
                            !currentUser?.isSuperAdmin &&
                            user.active !== false)
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                          user.active !== false
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                        } ${
                          currentUser?.role === "ADMIN" &&
                          currentUser?.id === user.id &&
                          user.active !== false
                            ? "cursor-not-allowed opacity-60 hover:bg-emerald-500/10"
                            : currentUser?.role === "ADMIN" &&
                                !currentUser?.isSuperAdmin &&
                                user.role === "ADMIN" &&
                                user.active !== false
                              ? "cursor-not-allowed opacity-60 hover:bg-emerald-500/10"
                            : ""
                        }`}
                      >
                        {user.active !== false ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                        {user.active !== false ? "Activo" : "Bloqueado"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(user)}
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
                {editingUserId ? "Editar Credenciales" : "Nuevo Usuario"}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Nombre Completo
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
                  Correo Electrónico (Acceso)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Contraseña{" "}
                  {editingUserId && "(Dejar en blanco para mantener actual)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  required={!editingUserId}
                  placeholder={editingUserId ? "••••••••" : "Min. 6 caracteres"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Rol en el Sistema
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="RECEPCIONISTA">Recepcionista</option>
                  <option value="ADMIN">Administrador Superior</option>
                </select>
                {formData.role === "ADMIN" && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1 mt-1 font-medium">
                    <ShieldAlert size={12} /> Cuidado: Nivel de acceso máximo
                    concedido.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Sincronizando..."
                    : editingUserId
                      ? "Actualizar Permisos"
                      : "Dar de Alta al Sistema"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
