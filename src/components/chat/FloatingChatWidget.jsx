import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X, Send, TerminalSquare, User, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ChatService } from "../../services/chat.service";
import { ReservationService } from "../../services/reservation.service";
import { TableService } from "../../services/table.service";

const CHAT_VARIANTS = {
  public: {
    scope: "public",
    title: "Lounge Asistente IA",
    subtitle: "Asistencia para clientes",
    userName: "Cliente",
    placeholder: "Pregunta por reservas, carta u horarios...",
  },
  staff: {
    scope: "staff",
    title: "Asistente Operativo IA",
    subtitle: "Soporte para staff",
    userName: "Staff",
    placeholder: "Pregunta por flujo de reservas y operación...",
  },
};

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
  if (!resolvedTableId) throw new Error("No pude identificar la mesa para crear la reserva.");
  const request = {
    table_id: Number(resolvedTableId),
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    number_people: Number(payload.number_people || payload.people || 0),
    notes: payload.notes?.trim() || "",
  };
  if (payload.client_id) return { ...request, client_id: Number(payload.client_id) };
  if (payload.client_data) return { ...request, client_data: payload.client_data };
  if (payload.client) return { ...request, client_data: payload.client };
  throw new Error("La IA no entregó los datos del cliente para crear la reserva.");
};

export const FloatingChatWidget = ({ variant = "public", userRole }) => {
  const navigate = useNavigate();
  const config = CHAT_VARIANTS[variant] || CHAT_VARIANTS.public;
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [executingActionId, setExecutingActionId] = useState(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => ChatService.getMessages(config.scope));

  useEffect(() => {
    const unsubscribe = ChatService.subscribe(config.scope, (nextMessages) => {
      setMessages(nextMessages);
    });
    return unsubscribe;
  }, [config.scope]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const prompt = inputValue.trim();
    ChatService.addMessage(config.scope, {
      sender: config.userName,
      role: "USER",
      text: prompt,
    });
    setInputValue("");
    setIsSending(true);

    try {
      const role = variant === "staff" ? userRole || "ADMIN" : "CLIENTE";
      const response = await ChatService.sendWebMessage({
        scope: config.scope,
        message: prompt,
        role,
      });

      const requiresConfirmation = ACTION_REQUIRES_CONFIRMATION.has(response?.action);

      ChatService.addMessage(config.scope, {
        sender: config.title,
        role: "BOT",
        text: response?.reply || "He procesado tu solicitud.",
        action: response?.action,
        payload: response?.payload || {},
      });

      if (!requiresConfirmation && response?.action && AUTO_ACTIONS.has(response.action)) {
        const route = getRouteFromAction({ action: response.action, payload: response.payload });
        if (route) setTimeout(() => navigate(route), 600);
      } else if (response?.action && response.action.startsWith("CREATE_")) {
        const route = getRouteFromAction({ action: response.action, payload: response.payload });
        if (route) setTimeout(() => navigate(route), 1500);
      }
    } catch (error) {
      const fallbackReply = ChatService.getAssistantReply(config.scope, prompt);
      ChatService.addMessage(config.scope, {
        sender: config.title,
        role: "BOT",
        text: fallbackReply,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = async (msg) => {
    if (!msg?.action || !ACTION_REQUIRES_CONFIRMATION.has(msg.action)) return;

    setExecutingActionId(msg.id);
    try {
      ChatService.updateMessage(config.scope, msg.id, { actionStatus: "confirmed" });

      if (msg.action === "CREATE_RESERVATION") {
        const request = await buildReservationRequest(msg.payload || {});
        const result = await ReservationService.create(request);
        ChatService.addMessage(config.scope, {
          sender: config.title,
          role: "BOT",
          text: "Reserva creada correctamente.",
          action: "CREATE_RESERVATION",
          payload: result?.data || request,
        });
        setTimeout(() => navigate("/admin/reservas"), 1500);
      }
    } catch (error) {
      ChatService.addMessage(config.scope, {
        sender: config.title,
        role: "BOT",
        text: error?.response?.data?.error || error.message || "No pude ejecutar esa acción.",
      });
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (msg) => {
    if (!msg?.action) return;
    ChatService.updateMessage(config.scope, msg.id, { actionStatus: "cancelled" });
    ChatService.addMessage(config.scope, {
      sender: config.title,
      role: "BOT",
      text: `Acción cancelada: ${ACTION_LABELS[msg.action] || "operación"}.`,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-card border border-border w-80 sm:w-96 rounded-md shadow-2xl mb-4 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-secondary/50 border-b border-border p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <TerminalSquare size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">
                  {config.title}
                </h3>
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-widest mt-1">
                  {config.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-background/50">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div
                  className={`flex gap-3 max-w-[90%] ${msg.role === "USER" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                      msg.role === "USER"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.role === "USER" ? (
                      <User size={12} />
                    ) : (
                      <TerminalSquare size={12} />
                    )}
                  </div>

                  <div
                    className={`flex flex-col ${msg.role === "USER" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-3 py-2 text-sm rounded-md ${
                        msg.role === "USER"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-secondary border border-border text-white rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {msg.time}
                    </span>
                  </div>
                </div>

                {msg.role === "BOT" && msg.action && variant === "staff" && msg.action === "CREATE_RESERVATION" && msg.actionStatus !== "confirmed" && msg.actionStatus !== "cancelled" && (
                  <div className="ml-9 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmAction(msg)}
                      disabled={executingActionId === msg.id}
                      className="inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} />
                      {executingActionId === msg.id ? "..." : ACTION_LABELS[msg.action] || msg.action}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelAction(msg)}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-secondary/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
                    >
                      <XCircle size={12} />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 max-w-[90%]">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <TerminalSquare size={12} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-md rounded-tl-none">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-card border-t border-border shrink-0 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={config.placeholder}
              disabled={isSending}
              className="flex-1 bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${
          isOpen
            ? "bg-secondary text-white border border-border"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};
