import { useEffect, useState } from "react";
import { TableService } from "../../services/table.service";
import { ReservationService } from "../../services/reservation.service";
import { CardWrapper } from "../../components/ui/CardWrapper";

export const StaffDashboardPage = () => {
  const [stats, setStats] = useState({
    tables: 0,
    reservations: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, resRes] = await Promise.all([
          TableService.getAll(),
          ReservationService.getAll(),
        ]);

        setStats({
          tables: tablesRes.data?.length || 0,
          reservations: resRes.data?.length || 0,
          loading: false,
        });
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  if (stats.loading)
    return (
      <div className="text-zinc-500 animate-pulse">
        Sincronizando con el servidor...
      </div>
    );

  return (
    <section className="grid gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
          Panel Operativo
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          Estado del Lounge
        </h2>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <CardWrapper title="Mesas Registradas">
          <p className="text-3xl font-bold text-white">{stats.tables}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configuradas en el sistema
          </p>
        </CardWrapper>

        <CardWrapper title="Reservas Totales">
          <p className="text-3xl font-bold text-primary">
            {stats.reservations}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Historico acumulado
          </p>
        </CardWrapper>

        <CardWrapper title="Estado del Sistema">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-medium text-emerald-500">Operativo</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Conexión con PostgreSQL
          </p>
        </CardWrapper>
      </div>
    </section>
  );
};
