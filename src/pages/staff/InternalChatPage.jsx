import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, CheckCircle2, XCircle } from "lucide-react";
import { ChatService } from "../../services/chat.service";
import { ReservationService } from "../../services/reservation.service";
import { TableService } from "../../services/table.service";
import { AuthService } from "../../services/auth.service";

const ACTION_REQUIRES_CONFIRMATION = new Set([
  "CREATE_RESERVATION",
]);

const AUTO_ACTIONS = new Set([
  "SHOW_DASHBOARD",
  "RENDER_TABLE_STATUS",
  "FIND_RESERVATION",
  "NAVIGATE_PAGE",
  "SHOW_RESERVATIONS",
  "SHOW_ORDERS",
  "SHOW_WAITERS",
  "UPDATE_PLATE",
  "UPDATE_TABLE",
  "MANAGE_USERS",
]);

const ACTION_LABELS = {
  SHOW_DASHBOARD: "Abrir dashboard",
  RENDER_TABLE_STATUS: "Ver mesas",
  FIND_RESERVATION: "Buscar reserva",
  NAVIGATE_PAGE: "Abrir sección",
  CREATE_RESERVATION: "Crear reserva",
  SHOW_RESERVATIONS: "Ver reservas",
  SHOW_ORDERS: "Ver órdenes",
  SHOW_WAITERS: "Ver meseros",
  CREATE_PLATE: "Crear plato",
  UPDATE_PLATE: "Actualizar plato",
  CREATE_TABLE: "Crear mesa",
  UPDATE_TABLE: "Actualizar mesa",
  MANAGE_USERS: "Gestionar usuarios",
};

const getActionSummary = (message) => {
  const payload = message?.payload || {};

  switch (message?.action) {
    case "SHOW_DASHBOARD":
      return "Ir al panel principal del staff.";
    case "RENDER_TABLE_STATUS":
      return "Ir a la vista de mesas para ver ocupación y disponibilidad.";
    case "FIND_RESERVATION":
      return `Buscar reserva con: ${payload.search_term || "criterio no definido"}.`;
    case "NAVIGATE_PAGE":
      return `Abrir ${payload.label || payload.route || "sección solicitada"}.`;
    case "CREATE_RESERVATION":
      return `Crear una reserva para ${payload.number_people || payload.people || "?"} persona(s) en ${payload.reservation_date || "fecha pendiente"} ${payload.reservation_time || "hora pendiente"}.`;
    case "SHOW_RESERVATIONS":
      return "Ir al listado de reservas.";
    case "SHOW_ORDERS":
      return "Ir al listado de órdenes.";
    case "SHOW_WAITERS":
      return "Ir al listado de meseros.";
    case "CREATE_PLATE":
      return `Crear plato: ${payload.name || "sin nombre"}.`;
    case "UPDATE_PLATE":
      return `Actualizar plato ID: ${payload.id || "?"}.`;
    case "CREATE_TABLE":
      return `Crear mesa #${payload.table_number || "?"}.`;
    case "UPDATE_TABLE":
      return `Actualizar mesa ID: ${payload.id || "?"}.`;
    case "MANAGE_USERS":
      return "Ir a gestión de usuarios.";
    default:
      return "";
  }
};

const getRouteFromAction = (message) => {
  const payload = message?.payload || {};

  switch (message?.action) {
    case "SHOW_DASHBOARD":
      return "/admin";
    case "RENDER_TABLE_STATUS":
    case "CREATE_TABLE":
    case "UPDATE_TABLE":
      return "/admin/mesas";
    case "FIND_RESERVATION":
      return `/admin/reservas?q=${encodeURIComponent(payload.search_term || "")}`;
    case "NAVIGATE_PAGE":
      return payload.route || "/admin";
    case "SHOW_RESERVATIONS":
    case "CREATE_RESERVATION":
      return "/admin/reservas";
    case "SHOW_ORDERS":
      return "/admin/ordenes";
    case "SHOW_WAITERS":
    case "CREATE_WAITER":
      return "/admin/meseros";
    case "CREATE_PLATE":
    case "UPDATE_PLATE":
      return "/admin/platos";
    case "MANAGE_USERS":
      return "/admin/usuarios";
    default:
      return null;
  }
};

const buildReservationRequest = async (payload) => {
  const tablesResponse = await TableService.getAll();
  const tables = tablesResponse.data || [];

  const resolvedTableId =
    payload.table_id ||
    tables.find((table) => String(table.table_number) === String(payload.table_number))?.id ||
    null;

  if (!resolvedTableId) {
    throw new Error("No pude identificar la mesa para crear la reserva.");
  }

  const request = {
    table_id: Number(resolvedTableId),
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    number_people: Number(payload.number_people || payload.people || 0),
    notes: payload.notes?.trim() || "",
  };

  if (payload.client_id) {
    return { ...request, client_id: Number(payload.client_id) };
  }

  if (payload.client_data) {
    return { ...request, client_data: payload.client_data };
  }

  if (payload.client) {
    return { ...request, client_data: payload.client };
  }

  throw new Error("La IA no entregó los datos del cliente para crear la reserva.");
};

export const InternalChatPage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [executingActionId, setExecutingActionId] = useState(null);
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

      if (!requiresConfirmation && response?.action && AUTO_ACTIONS.has(response.action)) {
        const route = getRouteFromAction({ action: response.action, payload: response.payload });
        if (route) setTimeout(() => navigate(route), 600);
      } else if (response?.action && response.action.startsWith("CREATE_")) {
        const route = getRouteFromAction({ action: response.action, payload: response.payload });
        if (route) setTimeout(() => navigate(route), 1500);
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

      if (message.action === "CREATE_RESERVATION") {
        const request = await buildReservationRequest(message.payload || {});
        const result = await ReservationService.create(request);
        ChatService.addMessage("staff", {
          sender: "Asistente Operativo IA",
          role: "BOT",
          text: "Reserva creada correctamente.",
          action: "CREATE_RESERVATION",
          payload: result?.data || request,
        });
        setTimeout(() => navigate("/admin/reservas"), 1500);
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
                      {msg.sender}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed bg-secondary/30 inline-block px-3 py-2 rounded-md border border-border/50">
                    {msg.text}
                  </div>

                  {msg.role === "BOT" && msg.action === "CREATE_RESERVATION" && msg.actionStatus !== "confirmed" && msg.actionStatus !== "cancelled" && (
                    <div className="mt-3 w-full max-w-xl rounded-md border border-primary/20 bg-primary/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                        Acción propuesta
                      </p>
                      <p className="mt-2 text-sm text-white font-medium">
                        {ACTION_LABELS[msg.action] || msg.action}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getActionSummary(msg)}
                      </p>

                      {msg.payload && Object.keys(msg.payload).length > 0 && (
                        <pre className="mt-3 overflow-x-auto rounded-sm border border-border bg-background/80 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
                          {JSON.stringify(msg.payload, null, 2)}
                        </pre>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(msg)}
                          disabled={executingActionId === msg.id}
                          className="inline-flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          {executingActionId === msg.id ? "Ejecutando..." : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelAction(msg)}
                          className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
                        >
                          <XCircle size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}


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
