import { useEffect, useState } from "react";
import { PlateService } from "../../services/plate.service";
import { UtensilsCrossed } from "lucide-react";

export const MenuPage = () => {
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchMenu = async () => {
      try {
        const response = await PlateService.getPublic();
        setPlates(response.data || []);
      } catch (error) {
        console.error("Error al cargar menú:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const categories = [...new Set(plates.map((p) => p.category))];

  return (
    <div className="py-20 px-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-16">
        <p className="text-xs uppercase tracking-[0.35em] text-primary mb-3">
          La Carta
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider mb-4">
          Nuestra Carta
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Descubre nuestros platos y bebidas, preparados para que disfrutes una
          experiencia completa en cada visita.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <UtensilsCrossed
            size={48}
            className="text-primary animate-pulse mb-4"
          />
          <p className="text-primary uppercase tracking-widest text-sm font-semibold animate-pulse">
            Cargando menú...
          </p>
        </div>
      ) : plates.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-md">
          Estamos actualizando nuestra carta. Vuelve pronto.
        </div>
      ) : (
        <div className="space-y-24">
          {categories.map((category) => (
            <div key={category}>
              <div className="flex items-center gap-4 mb-10">
                <h3 className="text-2xl font-black text-primary uppercase tracking-widest">
                  {category}
                </h3>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plates
                  .filter((p) => p.category === category)
                  .map((plate) => (
                    <article
                      key={plate.id}
                      className="flex flex-col bg-card rounded-sm border border-border hover:border-primary/50 transition-all hover:shadow-xl group overflow-hidden"
                    >
                      <div className="h-48 w-full bg-secondary/30 relative flex items-center justify-center border-b border-border overflow-hidden">
                        {plate.image_url ? (
                          <img
                            src={plate.image_url}
                            alt={plate.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <UtensilsCrossed
                            size={40}
                            className="text-muted-foreground/30"
                          />
                        )}
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white font-black px-3 py-1 rounded-sm border border-white/10 text-sm">
                          S/ {Number(plate.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                          {plate.name}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {plate.description ||
                            "Deliciosa especialidad preparada por nuestro chef."}
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
