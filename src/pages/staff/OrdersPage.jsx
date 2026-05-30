import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { OrderService } from "../../services/order.service";
import { PlateService } from "../../services/plate.service";
import { TableService } from "../../services/table.service";
import { WaiterService } from "../../services/waiter.service";
import { ReceiptText, RefreshCcw, ChefHat, CreditCard } from "lucide-react";

const getPeruTodayInputValue = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";

  return `${year}-${month}-${day}`;
};

const STATUS_FLOW = {
  PENDIENTE: "PREPARANDO",
  PREPARANDO: "LISTO",
  LISTO: "SERVIDO",
};

const STATUS_LABELS = {
  PENDIENTE: "Pendiente",
  PREPARANDO: "Preparando",
  LISTO: "Listo",
  SERVIDO: "Servido",
  PAGADO: "Pagado",
};

const statusStyle = (status) => {
  switch (status) {
    case "PENDIENTE":
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    case "PREPARANDO":
      return "bg-sky-500/10 border-sky-500/30 text-sky-400";
    case "LISTO":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    case "SERVIDO":
      return "bg-violet-500/10 border-violet-500/30 text-violet-400";
    default:
      return "bg-secondary/30 border-border text-muted-foreground";
  }
};

const getOrderItemsTotal = (order) =>
  (order?.items || []).reduce((total, item) => {
    return total + Number(item.price) * Number(item.quantity || 0);
  }, 0);

const getTodayDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value || "1970";
  const month = parts.find((part) => part.type === "month")?.value || "01";
  const day = parts.find((part) => part.type === "day")?.value || "01";

  return `${year}-${month}-${day}`;
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [plates, setPlates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSupportData, setLoadingSupportData] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(getPeruTodayInputValue());
  const [createForm, setCreateForm] = useState({
    reservation_id: "",
    waiter_id: "",
  });

  const loadSupportData = useCallback(async () => {
    setLoadingSupportData(true);
    try {
      const [tablesRes, waitersRes, platesRes] = await Promise.all([
        TableService.getAll(),
        WaiterService.getAll(),
        PlateService.getAll(),
      ]);

      const nextTables = tablesRes.data || [];
      setTables(nextTables);
      setWaiters(waitersRes.data || []);
      const menu = platesRes.data || [];
      setPlates(menu);
      const cats = [...new Set(menu.map((p) => p.category))];
      setCategories(cats);
      setActiveCategory((current) => current || cats[0] || "");

      const tableId = searchParams.get("tableId");
      const reservationId = searchParams.get("reservationId");
      if (reservationId) {
        const found = nextTables
          .flatMap((table) =>
            (table.reservations || []).map((reservation) => ({
              ...reservation,
              table_id: table.id,
              table_number: table.table_number,
              table_status: table.status,
            })),
          )
          .find((reservation) => String(reservation.id) === String(reservationId));

        if (found) {
          setCreateForm((current) => ({ ...current, reservation_id: String(found.id) }));
          const waiterId =
            found.assigned_waiter?.id ||
            found.waiter_id ||
            nextTables.find((table) => String(table.id) === String(found.table_id))?.waiter_id ||
            "";
          if (waiterId) setCreateForm((current) => ({ ...current, waiter_id: String(waiterId) }));
        }
      } else if (tableId) {
        const table = nextTables.find((item) => String(item.id) === String(tableId));
        const firstReservation = table?.reservations?.[0];
        if (firstReservation) {
          setCreateForm((current) => ({ ...current, reservation_id: String(firstReservation.id) }));
          const waiterId =
            firstReservation.assigned_waiter?.id ||
            firstReservation.waiter_id ||
            table?.waiter_id ||
            table?.waiter?.id ||
            "";
          if (waiterId) setCreateForm((current) => ({ ...current, waiter_id: String(waiterId) }));
        }
      }
    } catch (error) {
      console.error("Error al cargar apoyo de órdenes:", error);
    } finally {
      setLoadingSupportData(false);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);

      try {
        const response = await OrderService.getAll({
          ...(statusFilter ? { status: statusFilter } : {}),
          date: dateFilter,
        });
        const nextOrders = response.data?.data || [];
        setOrders(nextOrders);
      } catch (error) {
        console.error("Error al cargar órdenes:", error);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [statusFilter, dateFilter],
  );

  useEffect(() => {
    fetchOrders(true);
    loadSupportData();
  }, [fetchOrders, loadSupportData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchOrders(false);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const handleAdvanceStatus = async (order) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    setUpdatingOrderId(order.id);
    try {
      await OrderService.updateStatus(order.id, nextStatus);
      await fetchOrders(false);
    } catch (error) {
      alert(error?.response?.data?.error || "No se pudo actualizar la orden");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (order) => {
    const confirmed = window.confirm(
      `¿Cancelar la orden #${order.id}? Esta acción liberará la mesa y eliminará la comanda.`,
    );
    if (!confirmed) return;

    setUpdatingOrderId(order.id);
    try {
      await OrderService.cancel(order.id);
      await fetchOrders(false);
    } catch (error) {
      alert(error?.response?.data?.error || "No se pudo cancelar la orden");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const groupedByStatus = useMemo(() => {
    return {
      PENDIENTE: orders.filter((order) => order.status === "PENDIENTE"),
      PREPARANDO: orders.filter((order) => order.status === "PREPARANDO"),
      LISTO: orders.filter((order) => order.status === "LISTO"),
      SERVIDO: orders.filter((order) => order.status === "SERVIDO"),
    };
  }, [orders]);

  const availableReservations = useMemo(() => {
    return tables.flatMap((table) => {
      const reservations = Array.isArray(table.reservations) ? table.reservations : [];

      return reservations
        .filter((reservation) => {
          if (!reservation?.client?.id) return false;
          const reservationDate = String(reservation.reservation_date || "").slice(0, 10);
          const reservationStatus = String(reservation.status || "").toUpperCase();

          return reservationDate === dateFilter && ["PENDIENTE", "CONFIRMADA", "EN_CURSO"].includes(reservationStatus);
        })
        .map((reservation) => ({
          ...reservation,
          table_id: table.id,
          table_number: table.table_number,
          table_status: table.status,
        }));
    });
  }, [tables, dateFilter]);

  const selectedReservationMemo = useMemo(() => {
    if (!createForm.reservation_id) return null;
    return availableReservations.find((r) => String(r.id) === String(createForm.reservation_id)) || null;
  }, [availableReservations, createForm.reservation_id]);

  const selectedTable = useMemo(() => {
    if (selectedReservationMemo) {
      return tables.find((t) => String(t.id) === String(selectedReservationMemo.table_id)) || null;
    }
    return null;
  }, [tables, selectedReservationMemo]);

  const addPlateToCart = (plate) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.plate_id === plate.id);
      if (existing) {
        return prev.map((item) =>
          item.plate_id === plate.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...prev,
        { plate_id: plate.id, name: plate.name, price: plate.price, quantity: 1, notes: "" },
      ];
    });
  };

  const removePlateFromCart = (plateId) => {
    setCart((prev) => prev.filter((item) => item.plate_id !== plateId));
  };

  const updatePlateQuantity = (plateId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.plate_id !== plateId) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean),
    );
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 0), 0),
    [cart],
  );

  useEffect(() => {
    if (!selectedReservationMemo) return;

    if (String(createForm.waiter_id || "") === "") {
      const waiterId = selectedReservationMemo.assigned_waiter?.id || selectedReservationMemo.waiter_id || selectedTable?.waiter_id || selectedTable?.waiter?.id || "";
      if (waiterId) {
        setCreateForm((current) => ({
          ...current,
          waiter_id: String(waiterId),
        }));
      }
    }
  }, [selectedReservationMemo, createForm.waiter_id, selectedTable]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    if (!createForm.reservation_id) {
      alert("Selecciona un cliente/reserva para abrir la comanda.");
      return;
    }

    if (!createForm.waiter_id) {
      alert("Selecciona un mesero para abrir la comanda.");
      return;
    }

    if (String(selectedTable?.status || "").toUpperCase() === "OCUPADA") {
      alert("La mesa está ocupada. No se puede abrir otra orden hasta que se cierre la existente.");
      return;
    }

    setCreatingOrder(true);
    try {
      const payload = {
        table_id: Number(selectedReservationMemo.table_id),
        waiter_id: Number(createForm.waiter_id),
      };
      if (selectedReservationMemo?.client?.id) payload.client_id = Number(selectedReservationMemo.client.id);
      if (cart.length > 0) {
        payload.items = cart.map((item) => ({
          plate_id: item.plate_id,
          quantity: item.quantity,
          notes: item.notes,
        }));
      }

      const response = await OrderService.create(payload);
      const createdOrder = response.data?.data || response.data;
      await fetchOrders(false);
      setCreateForm({ reservation_id: "", waiter_id: "" });
      setCart([]);
      setIsNewOrderOpen(false);
      alert("Orden creada correctamente: #" + (createdOrder.id || ""));
      return createdOrder;
    } catch (error) {
      alert(error?.response?.data?.error || "No se pudo abrir la orden");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
            Cocina y Salón
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Órdenes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aquí ves y gestionas las comandas activas. La nueva orden se abre en una ventana emergente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewOrderOpen(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <CreditCard size={14} /> Nueva orden
          </button>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5"
          >
            <option value="">Todas activas</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PREPARANDO">Preparando</option>
            <option value="LISTO">Listo</option>
            <option value="SERVIDO">Servido</option>
          </select>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-white"
          >
            <RefreshCcw size={14} /> Actualizar
          </button>
        </div>
      </header>

      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl rounded-md border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-primary">Nueva orden</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Abrir comanda</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderOpen(false)}
                className="rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Selecciona un cliente/reserva del día y un mesero. La orden se crea aquí; POS solo muestra lo ordenado y se usa para cobrar al final.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Reserva / Cliente
                  </span>
                  <select
                    value={createForm.reservation_id}
                    onChange={(event) => setCreateForm((current) => ({ ...current, reservation_id: event.target.value }))}
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5"
                    disabled={loadingSupportData}
                  >
                    <option value="">Selecciona un cliente / reserva</option>
                    {availableReservations.map((reservation) => {
                      const fullName = reservation.client
                        ? `${reservation.client.name || ""} ${reservation.client.last_name || ""}`.trim()
                        : "Sin cliente";
                      return (
                        <option key={reservation.id} value={String(reservation.id)}>
                          {fullName} · Mesa {reservation.table_number} · {String(reservation.table_status || "").toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Mesero
                  </span>
                  <select
                    value={createForm.waiter_id}
                    onChange={(event) => setCreateForm((current) => ({ ...current, waiter_id: event.target.value }))}
                    className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5"
                    disabled={loadingSupportData}
                  >
                    <option value="">Selecciona mesero</option>
                    {waiters
                      .filter((waiter) => waiter.active)
                      .map((waiter) => (
                        <option key={waiter.id} value={String(waiter.id)}>
                          {waiter.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className="rounded-md border border-border bg-background/20 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Platos de la orden</p>
                    <p className="text-xs text-muted-foreground mt-1">Selecciona lo que consumirá antes de abrir la comanda.</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Total: S/ {cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("")}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${activeCategory === "" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {plates
                    .filter((plate) => (activeCategory ? plate.category === activeCategory : true) && plate.available)
                    .map((plate) => (
                      <button
                        key={plate.id}
                        type="button"
                        onClick={() => addPlateToCart(plate)}
                        className="rounded-sm border border-border bg-card/70 p-3 text-left hover:border-primary/40 transition-colors"
                      >
                        <p className="text-sm font-semibold text-white">{plate.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{plate.category}</p>
                        <p className="text-xs text-primary mt-2">S/ {Number(plate.price).toFixed(2)}</p>
                      </button>
                    ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Resumen</p>
                  {cart.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No has agregado platos todavía.</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.plate_id} className="flex items-center justify-between gap-3 rounded-sm border border-border bg-card/60 px-3 py-2 text-xs">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-muted-foreground">x{item.quantity} · S/ {(Number(item.price) * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updatePlateQuantity(item.plate_id, -1)} className="rounded border border-border px-2 py-1 text-muted-foreground">-</button>
                          <button type="button" onClick={() => updatePlateQuantity(item.plate_id, 1)} className="rounded border border-border px-2 py-1 text-muted-foreground">+</button>
                          <button type="button" onClick={() => removePlateFromCart(item.plate_id)} className="rounded border border-destructive/30 px-2 py-1 text-destructive">Quitar</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={creatingOrder || loadingSupportData}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <CreditCard size={14} />
                  {creatingOrder ? "Abriendo..." : "Abrir orden"}
                </button>

                <p className="text-xs text-muted-foreground max-w-2xl">
                  Si la mesa ya está ocupada no podrás crear otra orden hasta que se cierre la existente. El POS solo muestra lo ordenado y se usa al cobrar.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(groupedByStatus).map(([status, list]) => (
          <article key={status} className="rounded-md border border-border bg-card/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {STATUS_LABELS[status]} ({list.length})
              </h3>
            </div>

            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin órdenes en esta etapa.</p>
            ) : (
              <div className="space-y-3">
                {list.map((order) => (
                  <div key={order.id} className="rounded-sm border border-border bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Orden #{order.id} · Mesa {order.table?.table_number || order.table_id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliente: {order.client ? `${order.client.name || ""} ${order.client.last_name || ""}`.trim() : "Sin cliente"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mesero: {order.waiter?.name || "Sin mesero"}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusStyle(order.status)}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p>Items: {(order.items || []).length}</p>
                      <p>Subtotal: S/ {getOrderItemsTotal(order).toFixed(2)}</p>
                      {(order.items || []).length > 0 && (
                        <div className="mt-2 rounded-sm border border-border bg-background/40 p-2">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Se ordenó</p>
                          <ul className="space-y-1">
                            {order.items.map((item) => (
                              <li key={item.id} className="text-xs text-white flex items-center justify-between gap-2">
                                <span className="truncate">{item.plate?.name || 'Plato'}</span>
                                <span className="text-muted-foreground">x{item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUS_FLOW[order.status] && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order)}
                          disabled={updatingOrderId === order.id}
                          className="inline-flex items-center gap-2 rounded-sm bg-secondary px-3 py-2 text-xs font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
                        >
                          <ChefHat size={14} />
                          {updatingOrderId === order.id
                            ? "Actualizando..."
                            : `Pasar a ${STATUS_LABELS[STATUS_FLOW[order.status]]}`}
                        </button>
                      )}

                      {['PENDIENTE', 'PREPARANDO'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          disabled={updatingOrderId === order.id}
                          className="inline-flex items-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                        >
                          Cancelar orden
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/admin/mesas/${order.table_id}/pos${order.status === 'SERVIDO' ? '?checkout=1' : ''}`)}
                        className="inline-flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                      >
                        <CreditCard size={14} /> {order.status === 'SERVIDO' ? 'Cobrar en POS' : 'Ir a POS'}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/admin/mesas`)}
                        className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white"
                      >
                        <ReceiptText size={14} /> Ver mesas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

    </section>
  );
};
