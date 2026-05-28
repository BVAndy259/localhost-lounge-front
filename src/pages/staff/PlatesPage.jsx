import { useEffect, useState, useRef } from "react";
import { PlateService } from "../../services/plate.service";
import {
  Plus,
  X,
  PencilLine,
  CheckCircle2,
  Ban,
  Image as ImageIcon,
  UtensilsCrossed,
} from "lucide-react";

export const PlatesPage = () => {
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlateId, setEditingPlateId] = useState(null);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "FONDOS",
    image: null,
    imagePreview: null,
  });

  const fetchPlates = async () => {
    setLoading(true);
    try {
      const response = await PlateService.getAll();
      setPlates(response.data || []);
    } catch (error) {
      console.error("Error al cargar platos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlates();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const openCreateModal = () => {
    setEditingPlateId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "FONDOS",
      image: null,
      imagePreview: null,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plate) => {
    setEditingPlateId(plate.id);
    setFormData({
      name: plate.name,
      description: plate.description || "",
      price: plate.price.toString(),
      category: plate.category,
      image: null,
      imagePreview: plate.image_url || null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlateId(null);
  };

  const handleSubmitPlate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("category", formData.category);
      if (formData.description)
        data.append("description", formData.description);

      if (formData.image) {
        data.append("image", formData.image);
      }

      if (editingPlateId) {
        await PlateService.update(editingPlateId, data);
      } else {
        await PlateService.create(data);
      }

      closeModal();
      fetchPlates();
    } catch (error) {
      console.error("Error al guardar el plato:", error);
      alert(
        error.response?.data?.error || "Error al conectar con el servidor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (plate) => {
    try {
      await PlateService.toggleStatus(plate.id, !plate.available);
      fetchPlates();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  return (
    <section className="space-y-6 relative">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Gestión Gastronómica
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Carta y Menú
          </h2>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-sm text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Añadir Plato
        </button>
      </header>

      {loading ? (
        <div className="text-zinc-500 animate-pulse">Cargando la carta...</div>
      ) : plates.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-md">
          El menú está vacío. Registra tu primer plato para empezar a vender.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plates.map((plate) => (
            <article
              key={plate.id}
              className={`flex flex-col bg-card border border-border rounded-md overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg ${
                !plate.available ? "opacity-60 grayscale" : ""
              }`}
            >
              <div className="h-48 w-full bg-secondary/30 relative flex items-center justify-center border-b border-border">
                {plate.image_url ? (
                  <img
                    src={plate.image_url}
                    alt={plate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed
                    size={40}
                    className="text-muted-foreground/30"
                  />
                )}

                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-white/10 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-sm">
                  {plate.category}
                </div>

                <button
                  onClick={() => openEditModal(plate)}
                  className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border border-white/10 text-white p-1.5 rounded-sm hover:bg-primary hover:border-primary transition-colors"
                >
                  <PencilLine size={14} />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-1">
                    {plate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {plate.description || "Sin descripción detallada."}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-primary">
                    S/ {Number(plate.price).toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(plate)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors border ${
                      plate.available
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
                    }`}
                  >
                    {plate.available ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Ban size={14} />
                    )}
                    {plate.available ? "Disponible" : "Agotado"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-border shrink-0">
              <h3 className="text-lg font-semibold text-white">
                {editingPlateId ? "Editar Plato" : "Nuevo Plato"}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 scrollbar-thin">
              <form
                id="plateForm"
                onSubmit={handleSubmitPlate}
                className="space-y-5"
              >
                {/* Zona de Subida de Imagen */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Fotografía del Plato
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/20 relative overflow-hidden"
                  >
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground flex flex-col items-center">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">
                          Click para subir foto
                        </span>
                        <span className="text-xs mt-1">JPG, PNG o WEBP</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Nombre del Plato *
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

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="ENTRADAS">Entradas</option>
                      <option value="FONDOS">Platos de Fondo</option>
                      <option value="BEBIDAS">Bebidas</option>
                      <option value="POSTRES">Postres</option>
                      <option value="EXTRAS">Extras</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Precio (S/) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    required
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
                    placeholder="Ingredientes principales..."
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-border shrink-0 bg-card">
              <button
                form="plateForm"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-2.5 rounded-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Guardando en Cloudinary..."
                  : editingPlateId
                    ? "Actualizar Plato"
                    : "Guardar Plato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
