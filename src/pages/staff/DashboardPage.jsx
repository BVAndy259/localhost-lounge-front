import { useEffect, useState } from "react";
import { TableService } from "../../services/table.service";
import { ReservationService } from "../../services/reservation.service";
import { WaiterService } from "../../services/waiter.service";
import { CardWrapper } from "../../components/ui/CardWrapper";

const peruDateFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getDateInputValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "";

    const isoMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (isoMatch) {
      return isoMatch[1];
    }

    const slashMatch = trimmedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return trimmedValue;
    }

    const date = new Date(trimmedValue);
    if (!Number.isNaN(date.getTime())) {
      const parts = peruDateFormatter.formatToParts(date);
      const day = parts.find((part) => part.type === "day")?.value ?? "01";
      const month = parts.find((part) => part.type === "month")?.value ?? "01";
      const year = parts.find((part) => part.type === "year")?.value ?? "1970";

      return `${year}-${month}-${day}`;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const parts = peruDateFormatter.formatToParts(value);
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const year = parts.find((part) => part.type === "year")?.value ?? "1970";

    return `${year}-${month}-${day}`;
  }

  return "";
};

const getTodayKey = () => getDateInputValue(new Date());

const getHourFromReservationTime = (value) => {
  if (!value) return "--:--";
  if (typeof value === "string") return value.slice(0, 5);

  return "--:--";
};

export const StaffDashboardPage = () => {
  const [stats, setStats] = useState({
    tables: 0,
    reservations: 0,
    reservationsToday: 0,
    occupiedTables: 0,
    reservedTables: 0,
    activeWaiters: 0,
    busyWaiters: 0,
    recentReservations: [],
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, resRes, waitersRes] = await Promise.all([
          TableService.getAll(),
          ReservationService.getAll(),
          WaiterService.getAll(),
        ]);

        const tables = tablesRes.data || [];
        const reservations = resRes.data || [];
        const waiters = waitersRes.data || [];
        const todayKey = getTodayKey();

        const reservationsToday = reservations.filter(
          (reservation) => getDateInputValue(reservation.reservation_date) === todayKey
        );

        const recentReservations = reservations
          .filter((reservation) => ["CONFIRMADA", "EN_CURSO"].includes(reservation.status))
          .slice(0, 5);

        setStats({
          tables: tables.length,
          reservations: reservations.length,
          reservationsToday: reservationsToday.length,
          occupiedTables: tables.filter((table) => table.status === "OCUPADA").length,
          reservedTables: tables.filter((table) => table.status === "RESERVADA").length,
          activeWaiters: waiters.filter((waiter) => waiter.active !== false).length,
          busyWaiters: waiters.filter((waiter) => waiter.is_busy_today).length,
          recentReservations,
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

  const occupancyRate = stats.tables
    ? Math.round(((stats.occupiedTables + stats.reservedTables) / stats.tables) * 100)
    : 0;

  return (
    <section className="grid gap-6">
      <header className="rounded-sm border border-border bg-card/70 p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
          Panel Operativo
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Estado del Lounge</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Vista rápida de mesas, reservas y meseros para tomar decisiones sin entrar a cada módulo.
            </p>
          </div>

          <div className="rounded-sm border border-border bg-secondary/20 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Ocupación estimada
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{occupancyRate}%</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardWrapper title="Mesas">
          <p className="text-3xl font-bold text-white">{stats.tables}</p>
          <p className="text-xs text-muted-foreground mt-1">Registradas en el sistema</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-sm border border-border bg-secondary/20 px-3 py-2">
              <p className="text-muted-foreground">Ocupadas</p>
              <p className="mt-1 font-semibold text-destructive">{stats.occupiedTables}</p>
            </div>
            <div className="rounded-sm border border-border bg-secondary/20 px-3 py-2">
              <p className="text-muted-foreground">Reservadas</p>
              <p className="mt-1 font-semibold text-amber-500">{stats.reservedTables}</p>
            </div>
          </div>
        </CardWrapper>

        <CardWrapper title="Reservas">
          <p className="text-3xl font-bold text-primary">{stats.reservations}</p>
          <p className="text-xs text-muted-foreground mt-1">Histórico acumulado</p>
          <div className="mt-4 rounded-sm border border-border bg-secondary/20 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Hoy</p>
            <p className="mt-1 text-lg font-semibold text-white">{stats.reservationsToday}</p>
          </div>
        </CardWrapper>

        <CardWrapper title="Meseros">
          <p className="text-3xl font-bold text-white">{stats.activeWaiters}</p>
          <p className="text-xs text-muted-foreground mt-1">Activos para atención</p>
          <div className="mt-4 rounded-sm border border-border bg-secondary/20 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Con carga hoy</p>
            <p className="mt-1 text-lg font-semibold text-amber-500">{stats.busyWaiters}</p>
          </div>
        </CardWrapper>

        <CardWrapper title="Sistema">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-medium text-emerald-500">Operativo</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Conexión con PostgreSQL</p>
          <div className="mt-4 rounded-sm border border-border bg-secondary/20 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Salud general</p>
            <p className="mt-1 text-lg font-semibold text-white">Estable</p>
          </div>
        </CardWrapper>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <CardWrapper title="Reservas recientes">
          <div className="space-y-3">
            {stats.recentReservations.length ? (
              stats.recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between gap-4 rounded-sm border border-border bg-secondary/20 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {reservation.client
                        ? `${reservation.client.name || ""} ${reservation.client.last_name || ""}`.trim()
                        : "Sin cliente"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-1">
                      Mesa {reservation.table?.table_number || "--"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {getHourFromReservationTime(reservation.reservation_time)} hrs
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-1">
                      {reservation.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay reservas recientes para mostrar.
              </p>
            )}
          </div>
        </CardWrapper>

        <CardWrapper title="Resumen rápido">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/20 px-3 py-2">
              <span className="text-muted-foreground">Mesas libres</span>
              <span className="font-semibold text-emerald-500">
                {Math.max(stats.tables - stats.occupiedTables - stats.reservedTables, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/20 px-3 py-2">
              <span className="text-muted-foreground">Ocupación actual</span>
              <span className="font-semibold text-white">{occupancyRate}%</span>
            </div>
            <div className="flex items-center justify-between rounded-sm border border-border bg-secondary/20 px-3 py-2">
              <span className="text-muted-foreground">Meseros en límite</span>
              <span className="font-semibold text-destructive">{stats.busyWaiters}</span>
            </div>
          </div>
        </CardWrapper>
      </div>
    </section>
  );
};
