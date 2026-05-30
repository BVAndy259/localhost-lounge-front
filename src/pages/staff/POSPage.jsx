import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PlateService } from "../../services/plate.service";
import { OrderService } from "../../services/order.service";
import { TableService } from "../../services/table.service";
import {
  UtensilsCrossed,
  Send,
  CreditCard,
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
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

const getDateInputValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
    if (isoMatch) return isoMatch[1];
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const parts = peruDateFormatter.formatToParts(parsedDate);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${year}-${month}-${day}`;
};

const getHourInputValue = (value) => {
  if (!value) return "--:--";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "--:--";

    if (/^\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 5);

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return peruTimeFormatter.format(parsed);
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "--:--";

  return peruTimeFormatter.format(parsedDate);
};

const getPeruTodayInputValue = () => getDateInputValue(new Date());

export const POSPage = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plates, setPlates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");

  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [documentType, setDocumentType] = useState("BOLETA");

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);

  const reservationDateFilter = searchParams.get("date") || getPeruTodayInputValue();
  const reservationHourFilter = searchParams.get("hour") || "";

  useEffect(() => {
    const loadData = async () => {
      try {
        const [platesRes, tableRes, activeOrderRes] = await Promise.all([
          PlateService.getAll(),
          TableService.getById(tableId),
          OrderService.getActiveByTable(tableId),
        ]);

        const menu = platesRes.data || [];
        setPlates(menu);
        const nextTable = tableRes.data?.data || tableRes.data;
        setTable(nextTable);

        const activeOrder = activeOrderRes.data?.data || null;
        setOrder(activeOrder);

        const reservationFromQuery = searchParams.get("reservationId");
        const hasReservationInTable = nextTable?.reservations?.some(
          (reservation) => String(reservation.id) === String(reservationFromQuery),
        );

        const activeReservations = (nextTable?.reservations || []).filter(
          (reservation) => !["CANCELADA", "COMPLETADA"].includes(String(reservation.status || "").toUpperCase()),
        );
        const matchedReservation = activeOrder?.client_id
          ? activeReservations.find(
              (reservation) => String(reservation.client_id || reservation.client?.id) === String(activeOrder.client_id),
            )
          : null;
        const fallbackReservation = matchedReservation || activeReservations[0] || null;

        if (reservationFromQuery && hasReservationInTable) {
          setSelectedReservationId(String(reservationFromQuery));
        } else if (fallbackReservation) {
          setSelectedReservationId(String(fallbackReservation.id));
        } else {
          setSelectedReservationId("");
        }

        const cats = [...new Set(menu.map((p) => p.category))];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0]);

        // Si se pidió el checkout desde órdenes, abrir modal de cobro automáticamente
        if (searchParams.get("checkout") === "1") {
          setCheckoutModal(true);
        }

      } catch (error) {
        console.error("Error cargando POS:", error);
      }
    };
    loadData();
  }, [tableId, searchParams]);

  const reservationsForClient = (table?.reservations || []).filter((reservation) => {
    const reservationDate = getDateInputValue(reservation.reservation_date);
    const reservationHour = getHourInputValue(reservation.reservation_time);

    const matchesDate = reservationDate === reservationDateFilter;
    const matchesHour = reservationHourFilter
      ? reservationHour === reservationHourFilter
      : true;

    return matchesDate && matchesHour;
  });

  const selectedReservation = reservationsForClient.find(
    (reservation) => String(reservation.id) === selectedReservationId,
  );

  const selectedClientLabel = selectedReservation?.client
    ? `${selectedReservation.client.name || ""} ${selectedReservation.client.last_name || ""}`.trim()
    : "Selecciona una reserva con cliente";

  const vipReservationCost =
    selectedReservation && String(table?.type || "").toUpperCase() === "VIP"
      ? Number(table?.reservation_price || 0)
      : 0;

  const addToCart = (plate) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.plate_id === plate.id);
      if (existing) {
        return prev.map((item) =>
          item.plate_id === plate.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          plate_id: plate.id,
          name: plate.name,
          price: plate.price,
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const updateQuantity = (plateId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.plate_id === plateId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (plateId) => {
    setCart((prev) => prev.filter((item) => item.plate_id !== plateId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const orderItemsTotal = (order?.items || []).reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const taxableTotal = orderItemsTotal + vipReservationCost;
  const igvAmount = taxableTotal * 0.18;
  const checkoutTotal = taxableTotal + igvAmount;

  const formatCurrency = (value) => `S/ ${Number(value ?? 0).toFixed(2)}`;

  const downloadReceiptPdf = async (selectedDocumentType) => {
    const response = await OrderService.getReceiptPdf(order.id, {
      document_type: selectedDocumentType,
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comprobante-orden-${order.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      let currentOrderId = order?.id;
      if (!currentOrderId) {
        alert("La orden debe abrirse primero desde el módulo Órdenes.");
        return;
      }

      await OrderService.addItems(currentOrderId, {
        items: cart.map((c) => ({
          plate_id: c.plate_id,
          quantity: c.quantity,
          notes: c.notes,
        })),
      });

      setCart([]);
      alert("Orden registrada. Ahora puedes seguir su estado en el módulo Órdenes.");
      navigate("/admin/ordenes");
    } catch (error) {
      alert("Error al enviar la comanda: " + error.response?.data?.error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async (paymentMethod) => {
    if (!order?.id) return;
    setIsProcessing(true);
    try {
      await OrderService.checkout(order.id, {
        payment_method: paymentMethod,
        reservation_cost: vipReservationCost,
      });
      await downloadReceiptPdf(documentType);
      navigate("/admin/mesas");
    } catch (error) {
      alert("Error en facturación: " + error.response?.data?.error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveOrderItem = async (itemId) => {
    if (!order?.id) return;

    const confirmed = window.confirm("¿Quitar este plato de la orden?");
    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const response = await OrderService.deleteItem(order.id, itemId);
      setOrder(response.data?.data || null);
      alert("Plato retirado de la orden.");
    } catch (error) {
      alert("Error al quitar el plato: " + error.response?.data?.error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!table)
    return (
      <div className="p-10 text-center animate-pulse">
        Cargando terminal POS...
      </div>
    );

  if (checkoutModal) {
    return (
      <div className="min-h-screen w-full bg-linear-to-b from-card to-background text-white font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 lg:px-8">
          <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-primary">Cobro POS</p>
              <h1 className="text-2xl font-black">Mesa {table.table_number || table.id}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Vista completa de cobro, sin ventana flotante.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCheckoutModal(false)}
                className="rounded-sm border border-border bg-secondary/60 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
              >
                Volver al POS
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/mesas")}
                className="rounded-sm border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-white"
              >
                Salir
              </button>
            </div>
          </header>

          <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <section className="rounded-md border border-border bg-card/70 p-5 shadow-xl shadow-black/10">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Detalle de compra
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-wide">
                    {documentType === "FACTURA" ? "Factura" : "Boleta"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedReservation?.client
                      ? `${selectedReservation.client.name || ""} ${selectedReservation.client.last_name || ""}`.trim()
                      : "Consumidor final"}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background/60 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Documento
                  </p>
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="mt-2 bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BOLETA">Boleta</option>
                    <option value="FACTURA">Factura</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 space-y-2 rounded-md border border-border bg-background/50 p-4">
                {(order?.items || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">La orden aún no tiene platos cargados.</p>
                ) : (
                  order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-white">{item.plate?.name || "Plato"}</p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                          {item.notes ? ` · Nota: ${item.notes}` : ""}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                        <p className="font-bold text-primary">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-md border border-border bg-card/70 p-5 shadow-xl shadow-black/10">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Resumen
              </h3>
              <div className="mt-4 space-y-3 border-b border-border pb-4 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal platos</span>
                  <span>{formatCurrency(orderItemsTotal)}</span>
                </div>
                {vipReservationCost > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Reserva VIP</span>
                    <span>{formatCurrency(vipReservationCost)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>I.G.V 18%</span>
                  <span>{formatCurrency(igvAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-black text-white">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(checkoutTotal)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Método de pago
              </p>
              <div className="mt-3 grid gap-3">
                {["EFECTIVO", "TARJETA", "YAPE", "PLIN"].map((method) => (
                  <button
                    key={method}
                    onClick={() => handleCheckout(method)}
                    disabled={isProcessing}
                    className="rounded-sm border border-border bg-secondary/60 px-4 py-3 text-sm font-bold text-white hover:bg-secondary disabled:opacity-50"
                  >
                    {isProcessing ? "Procesando..." : `${method} · Descargar ${documentType}`}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                La reserva se marcará como completada y el comprobante se generará en PDF.
              </p>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden font-sans">
      <div className="flex-1 flex flex-col border-r border-border bg-card/50">
        <header className="h-16 flex items-center gap-4 px-6 border-b border-border bg-background shrink-0">
          <button
            onClick={() => navigate("/admin/mesas")}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">
              Mesa {table.table_number || table.id}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-primary mt-1">
              Terminal de Pedidos
            </p>
          </div>
        </header>

        <div className="px-4 py-3 border-b border-border bg-card/70">
          <label className="block text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Cliente / Reserva
          </label>
          <select
            value={selectedReservationId}
            onChange={(event) => setSelectedReservationId(event.target.value)}
            className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Selecciona cliente reservado</option>
            {reservationsForClient.map((reservation) => {
              const fullName = reservation.client
                ? `${reservation.client.name || ""} ${reservation.client.last_name || ""}`.trim()
                : "Cliente sin nombre";
              const hour = getHourInputValue(reservation.reservation_time);

              return (
                <option key={reservation.id} value={String(reservation.id)}>
                  {fullName} - {hour}
                </option>
              );
            })}
          </select>

          <p className="mt-2 text-xs text-muted-foreground">
            Filtro activo: {reservationDateFilter}
            {reservationHourFilter ? ` ${reservationHourFilter}` : " (todas las horas)"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Atendiendo: <span className="text-white font-medium">{selectedClientLabel}</span>
          </p>
        </div>

        <div className="flex items-center overflow-x-auto p-4 gap-2 border-b border-border bg-card shrink-0 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:text-white hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plates
              .filter((p) => p.category === activeCategory && p.available)
              .map((plate) => (
                <button
                  key={plate.id}
                  onClick={() => addToCart(plate)}
                  className="flex flex-col bg-background border border-border rounded-md overflow-hidden hover:border-primary/50 transition-all text-left group"
                >
                  <div className="h-28 w-full bg-secondary/30 relative flex items-center justify-center border-b border-border overflow-hidden">
                    {plate.image_url ? (
                      <img
                        src={plate.image_url}
                        alt={plate.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <UtensilsCrossed
                        size={24}
                        className="text-muted-foreground/30"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="text-white" size={32} />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                      {plate.name}
                    </h3>
                    <span className="text-xs font-black text-primary mt-1 block">
                      S/ {Number(plate.price).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col bg-background shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)] z-10">
        <div className="p-5 border-b border-border bg-card">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-primary" />
            Comanda Actual
          </h3>
        </div>

        <div className="p-4 border-b border-border bg-card/60">
          <h4 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Platos ya cargados en la orden
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {(order?.items || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">La orden aún no tiene platos.</p>
            ) : (
              order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-sm border border-border bg-background/40 px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-white">{item.plate?.name || "Plato"}</p>
                    <p className="text-muted-foreground">x{item.quantity} · S/ {Number(item.price).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOrderItem(item.id)}
                    disabled={isProcessing || order.status === "PAGADO"}
                    className="rounded-sm border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50">
              <UtensilsCrossed size={48} />
              <p className="text-sm">Selecciona platos del menú</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.plate_id}
                className="bg-card border border-border p-3 rounded-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm text-white leading-tight pr-2">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.plate_id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-sm border border-border p-1">
                    <button
                      onClick={() => updateQuantity(item.plate_id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.plate_id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-black text-primary">
                    S/ {(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-card border-t border-border space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal Platos</span>
              <span>S/ {cartTotal.toFixed(2)}</span>
            </div>
            {vipReservationCost > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Reserva / VIP</span>
                <span>S/ {vipReservationCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span className="text-primary">
                S/{" "}
                {(cartTotal + vipReservationCost).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleSendOrder}
              disabled={
                cart.length === 0 ||
                isProcessing ||
                !Number(table?.waiter_id || table?.waiter?.id) ||
                !Number(selectedReservation?.client?.id)
              }
              className="bg-secondary hover:bg-secondary/80 text-white font-semibold py-3 rounded-sm flex flex-col items-center justify-center gap-1 transition-colors border border-border disabled:opacity-50"
            >
              <Send size={18} />
              <span className="text-[10px] uppercase tracking-wider">
                Registrar Orden
              </span>
            </button>
            <button
              onClick={() => setCheckoutModal(true)}
              disabled={isProcessing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-sm flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <CreditCard size={18} />
              <span className="text-[10px] uppercase tracking-wider">
                Cobrar
              </span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
