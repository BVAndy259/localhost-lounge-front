import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot, User, LayoutDashboard, Table2, Users, ReceiptText, Sparkles, UtensilsCrossed } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { ChatService } from "../../services/chat.service";
import { ReservationService } from "../../services/reservation.service";

const ACTION_REQUIRES_CONFIRMATION = new Set([
  "CREATE_WAITER",
  "CREATE_TABLE",
  "CREATE_PLATE",
]);

const CREATE_ACTIONS = new Set(["CREATE_WAITER", "CREATE_TABLE", "CREATE_PLATE"]);

const ACTION_LABELS = {
  SHOW_DASHBOARD: "Abrir dashboard",
  RENDER_TABLE_STATUS: "Ver mesas",
  FIND_RESERVATION: "Buscar reserva",
  NAVIGATE_PAGE: "Abrir sección",
  SHOW_RESERVATIONS: "Ver reservas",
  SHOW_ORDERS: "Ver órdenes",
  SHOW_WAITERS: "Ver meseros",
  CREATE_WAITER: "Crear mesero",
  CREATE_PLATE: "Crear plato",
  UPDATE_PLATE: "Actualizar plato",
  CREATE_TABLE: "Crear mesa",
  UPDATE_TABLE: "Actualizar mesa",
  MANAGE_USERS: "Gestionar usuarios",
};

export const InternalChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [executingActionId, setExecutingActionId] = useState(null);
  const [actionView, setActionView] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUser = useMemo(() => {
    try {
      const rawUser = localStorage.getItem("lhl_user");
      return rawUser ? JSON.parse(rawUser) : { role: "ADMIN" };
    } catch {
      return { role: "ADMIN" };
    }
  }, []);

  const [messages, setMessages] = useState(() => ChatService.getMessages("staff"));

  useEffect(() => {
    const unsubscribe = ChatService.subscribe("staff", (nextMessages) => {
      setMessages(nextMessages);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    ChatService.addMessage("staff", {
      sender: "Staff",
      role: "USER",
      text: prompt,
    });

    setInputValue("");
    setIsSending(true);

    try {
      const response = await ChatService.sendWebMessage({
        scope: "staff",
        message: prompt,
        role: currentUser?.role || "ADMIN",
      });

      const requiresConfirmation = ACTION_REQUIRES_CONFIRMATION.has(response?.action);

      ChatService.addMessage("staff", {
        sender: "Asistente Operativo IA",
        role: "BOT",
        text: response?.reply || "He procesado tu solicitud.",
        action: response?.action,
        payload: response?.payload || {},
        requiresConfirmation,
      });

      if (response?.action === "SHOW_DASHBOARD") {
        setActionView({
          kind: "dashboard",
          title: "Reportes de hoy",
          payload: response?.payload?.dashboard || null,
          reply: response?.reply,
        });
      } else if (response?.action === "RENDER_TABLE_STATUS") {
        setActionView({
          kind: "tables",
          title: "Estado de mesas",
          payload: response?.payload?.tables || [],
          reply: response?.reply,
        });
      } else if (response?.action === "SHOW_RESERVATIONS") {
        setActionView({
          kind: "reservations",
          title: "Reservas recientes",
          payload: response?.payload?.reservations || [],
          reply: response?.reply,
        });
      } else if (response?.action === "SHOW_ORDERS") {
        setActionView({
          kind: "orders",
          title: "Órdenes recientes",
          payload: response?.payload?.orders || [],
          reply: response?.reply,
        });
      } else if (response?.action === "SHOW_WAITERS") {
        setActionView({
          kind: "waiters",
          title: "Meseros",
          payload: response?.payload?.waiters || [],
          reply: response?.reply,
        });
      } else if (response?.action === "SHOW_MENU") {
        setActionView({
          kind: "menu",
          title: "Carta / Platos",
          payload: response?.payload?.plates || [],
          reply: response?.reply,
        });
      } else if (response?.action === "FIND_RESERVATION") {
        const searchTerm = String(response?.payload?.search_term || prompt).trim().toLowerCase();
        const reservationsResponse = await ReservationService.getAll();
        const reservations = reservationsResponse.data || [];
        const filtered = reservations.filter((reservation) => {
          const clientName = `${reservation.client?.name || ""} ${reservation.client?.last_name || ""}`.toLowerCase();
          const phone = String(reservation.client?.phone_number || "").toLowerCase();
          const email = String(reservation.client?.email || "").toLowerCase();
          const tableNumber = String(reservation.table?.table_number || reservation.table_id || "").toLowerCase();
          const status = String(reservation.status || "").toLowerCase();
          return [clientName, phone, email, tableNumber, status, String(reservation.id || "")].some((value) =>
            value.includes(searchTerm),
          );
        });

        setActionView({
          kind: "reservation-search",
          title: `Búsqueda: ${searchTerm || "reservas"}`,
          payload: filtered,
          reply: response?.reply,
        });
      } else if (CREATE_ACTIONS.has(response?.action)) {
        setActionView({
          kind: "create",
          title: ACTION_LABELS[response.action] || "Creación",
          action: response?.action,
          payload: response?.payload || {},
          reply: response?.reply,
          requiresConfirmation,
        });
      } else if (response?.action === "NAVIGATE_PAGE") {
        setActionView({
          kind: "route",
          title: "Sección solicitada",
          payload: response?.payload || {},
          reply: response?.reply,
        });
      } else {
        setActionView(null);
      }
    } catch (error) {
      const fallbackReply = ChatService.getAssistantReply("staff", prompt);
      ChatService.addMessage("staff", {
        sender: "Asistente Operativo IA",
        role: "BOT",
        text: fallbackReply,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = async (message) => {
    if (!message?.action || !ACTION_REQUIRES_CONFIRMATION.has(message.action)) return;

    setExecutingActionId(message.id);
    try {
      ChatService.updateMessage("staff", message.id, { actionStatus: "confirmed" });

      let followUpAction = null;

      if (message.action === "CREATE_WAITER") {
        const created = message.payload?.waiter || message.payload || {};
        ChatService.addMessage("staff", {
          sender: "Asistente Operativo IA",
          role: "BOT",
          text: `Mesero ${created.name || ""} creado exitosamente.`,
          action: "CREATE_WAITER",
          payload: created,
        });
        setActionView({
          kind: "create-result",
          title: "Mesero creado",
          action: "CREATE_WAITER",
          payload: created,
          reply: "Mesero creado correctamente.",
        });
        followUpAction = "SHOW_WAITERS";
      } else if (message.action === "CREATE_TABLE") {
        const created = message.payload?.table || message.payload || {};
        ChatService.addMessage("staff", {
          sender: "Asistente Operativo IA",
          role: "BOT",
          text: `Mesa ${created.table_number || ""} registrada correctamente.`,
          action: "CREATE_TABLE",
          payload: created,
        });
        setActionView({
          kind: "create-result",
          title: "Mesa creada",
          action: "CREATE_TABLE",
          payload: created,
          reply: "Mesa creada correctamente.",
        });
        followUpAction = "RENDER_TABLE_STATUS";
      } else if (message.action === "CREATE_PLATE") {
        const created = message.payload?.plate || message.payload || {};
        ChatService.addMessage("staff", {
          sender: "Asistente Operativo IA",
          role: "BOT",
          text: `Plato "${created.name || ""}" añadido al menú.`,
          action: "CREATE_PLATE",
          payload: created,
        });
        setActionView({
          kind: "create-result",
          title: "Plato creado",
          action: "CREATE_PLATE",
          payload: created,
          reply: "Plato creado correctamente.",
        });
        followUpAction = "SHOW_MENU";
      }

      if (followUpAction) {
        const response = await ChatService.sendWebMessage({
          scope: "staff",
          message: `trigger ${followUpAction}`,
          role: currentUser?.role || "ADMIN",
        });
        if (response) {
          ChatService.addMessage("staff", {
            sender: "Asistente Operativo IA",
            role: "BOT",
            text: response?.reply || "Datos actualizados.",
            action: response?.action,
            payload: response?.payload || {},
          });
          const actionHandlers = {
            SHOW_WAITERS: "waiters",
            RENDER_TABLE_STATUS: "tables",
            SHOW_MENU: "menu",
          };
          const kind = actionHandlers[followUpAction];
          if (kind) {
            setActionView({
              kind,
              title: kind === "waiters" ? "Meseros" : kind === "tables" ? "Estado de mesas" : "Carta / Platos",
              payload: response?.payload?.[kind === "waiters" ? "waiters" : kind === "tables" ? "tables" : "plates"] || [],
              reply: response?.reply,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error al ejecutar acción IA:", error);
      ChatService.addMessage("staff", {
        sender: "Asistente Operativo IA",
        role: "BOT",
        text: error?.response?.data?.error || error.message || "No pude ejecutar esa acción.",
      });
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (message) => {
    if (!message?.action) return;

    ChatService.updateMessage("staff", message.id, { actionStatus: "cancelled" });

    ChatService.addMessage("staff", {
      sender: "Asistente Operativo IA",
      role: "BOT",
      text: `Acción cancelada: ${ACTION_LABELS[message.action] || "operación"}.`,
    });
  };

  return (
    <section className="h-[calc(100vh-8rem)] flex flex-col relative">
      <header className="mb-4 shrink-0">
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">
          Comunicaciones
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Asistente IA</h2>
      </header>

      <div className="flex-1 bg-card border border-border rounded-md shadow-sm flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-background/50">
          <div className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-secondary/50">
            <Bot size={18} className="text-primary mr-2" />
            <span className="font-bold text-white">Asistente Operativo IA</span>
            <span className="text-xs text-muted-foreground ml-3 hidden sm:block border-l border-border pl-3">
              Soporte interno para personal staff
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                  {msg.role === "BOT" ? (
                    <Bot size={18} className="text-primary" />
                  ) : (
                    <User size={18} className="text-muted-foreground" />
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className={`font-bold ${msg.role === "BOT" ? "text-primary" : "text-white"}`}
                    >

          {actionView && (
            <div className="border-t border-border bg-card/90 p-5 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                {actionView.kind === "dashboard" ? <LayoutDashboard size={16} className="text-primary" /> : null}
                {actionView.kind === "tables" ? <Table2 size={16} className="text-primary" /> : null}
                {actionView.kind === "reservations" || actionView.kind === "reservation-search" ? <ReceiptText size={16} className="text-primary" /> : null}
                {actionView.kind === "waiters" ? <Users size={16} className="text-primary" /> : null}
                {actionView.kind === "menu" ? <UtensilsCrossed size={16} className="text-primary" /> : null}
                {actionView.kind === "orders" ? <ReceiptText size={16} className="text-primary" /> : null}
                {actionView.kind === "create-result" ? <Sparkles size={16} className="text-primary" /> : null}
                <h3 className="text-sm font-bold text-white">{actionView.title}</h3>
              </div>

              {actionView.reply && (
                <p className="text-sm text-muted-foreground mb-4">{actionView.reply}</p>
              )}

              {actionView.kind === "dashboard" && actionView.payload && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-md border border-border bg-background/80 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mesas totales</p>
                    <p className="text-2xl font-bold text-white">{actionView.payload.tables?.total ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/80 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mesas libres</p>
                    <p className="text-2xl font-bold text-white">{actionView.payload.tables?.libres ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/80 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mesas ocupadas</p>
                    <p className="text-2xl font-bold text-white">{actionView.payload.tables?.ocupadas ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/80 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reservas hoy</p>
                    <p className="text-2xl font-bold text-white">{actionView.payload.reservations?.today_total ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border bg-background/80 p-3 md:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reservas pendientes</p>
                    <p className="text-2xl font-bold text-white">{actionView.payload.reservations?.pending ?? 0}</p>
                  </div>
                </div>
              )}

              {actionView.kind === "tables" && Array.isArray(actionView.payload) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {actionView.payload.map((table) => (
                    <div key={table.id} className="rounded-md border border-border bg-background/80 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">Mesa {table.table_number}</p>
                        <span className="text-xs text-primary font-bold">{table.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{table.type} · {table.capacity} pax</p>
                      <p className="text-xs text-muted-foreground mt-1">Mesero: {table.waiter?.name || "Sin asignar"}</p>
                    </div>
                  ))}
                </div>
              )}

              {actionView.kind === "reservations" || actionView.kind === "reservation-search" ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Array.isArray(actionView.payload) && actionView.payload.length > 0 ? (
                    actionView.payload.map((reservation) => (
                      <div key={reservation.id} className="rounded-md border border-border bg-background/80 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">Reserva #{reservation.id}</p>
                          <span className="text-xs text-primary font-bold">{reservation.status}</span>
                        </div>
                        <p className="text-muted-foreground mt-1">{reservation.client?.name} {reservation.client?.last_name}</p>
                        <p className="text-muted-foreground">Mesa {reservation.table?.table_number || reservation.table_id} · {reservation.reservation_date} {reservation.reservation_time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay resultados para esta consulta.</p>
                  )}
                </div>
              ) : null}

              {actionView.kind === "orders" && Array.isArray(actionView.payload) && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {actionView.payload.length > 0 ? actionView.payload.map((order) => (
                    <div key={order.id} className="rounded-md border border-border bg-background/80 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">Orden #{order.id}</p>
                        <span className="text-xs text-primary font-bold">{order.status}</span>
                      </div>
                      <p className="text-muted-foreground mt-1">Mesa {order.table?.table_number || order.table_id}</p>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No hay órdenes registradas.</p>}
                </div>
              )}

              {actionView.kind === "waiters" && Array.isArray(actionView.payload) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {actionView.payload.map((waiter) => (
                    <div key={waiter.id} className="rounded-md border border-border bg-background/80 p-3">
                      <p className="font-semibold text-white">{waiter.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{waiter.phone_number || "Sin teléfono"}</p>
                    </div>
                  ))}
                </div>
              )}

              {actionView.kind === "menu" && Array.isArray(actionView.payload) && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {actionView.payload.length > 0 ? actionView.payload.map((plate) => (
                    <div key={plate.id} className="rounded-md border border-border bg-background/80 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{plate.name}</p>
                        <span className="text-xs text-primary font-bold">S/. {Number(plate.price).toFixed(2)}</span>
                      </div>
                      <p className="text-muted-foreground mt-1">{plate.category}</p>
                      {plate.description && <p className="text-xs text-muted-foreground mt-1">{plate.description}</p>}
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No hay platos registrados.</p>}
                </div>
              )}

              {actionView.kind === "create-result" && actionView.payload && (
                <pre className="max-h-56 overflow-auto rounded-md border border-border bg-background/80 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
                  {JSON.stringify(actionView.payload, null, 2)}
                </pre>
              )}
            </div>
          )}
                      {msg.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed bg-secondary/30 inline-block px-3 py-2 rounded-md border border-border/50">
                    {msg.text}
                  </div>

                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-card border-t border-border shrink-0">
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe una consulta operativa..."
                className="w-full bg-secondary/50 border border-border text-white text-sm rounded-sm pl-4 pr-12 py-3 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="absolute right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
