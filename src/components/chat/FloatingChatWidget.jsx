import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  X,
  Send,
  TerminalSquare,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const ACTION_REQUIRES_CONFIRMATION = new Set([
  "CREATE_WAITER",
  "CREATE_TABLE",
  "CREATE_PLATE",
]);

const AUTO_ACTIONS = new Set([
  "SHOW_DASHBOARD",
  "RENDER_TABLE_STATUS",
  "FIND_RESERVATION",
  "NAVIGATE_PAGE",
  "SHOW_RESERVATIONS",
  "SHOW_ORDERS",
  "SHOW_WAITERS",
  "SHOW_MENU",
  "MANAGE_USERS",
  "PREFILL_RESERVATION",
]);

const ADMIN_ROUTES = new Set([
  "dashboard", "reservas", "ordenes", "mesas", "meseros", "usuarios", "platos", "carta",
]);

const getRouteFromAction = (action, payload, variant) => {
  switch (action) {
    case "SHOW_DASHBOARD":
      return "/admin";
    case "RENDER_TABLE_STATUS":
      return "/admin/mesas";
    case "FIND_RESERVATION":
      return `/admin/reservas?q=${encodeURIComponent(payload?.search_term || "")}`;
    case "NAVIGATE_PAGE":
      if (!payload?.route) return null;
      const route = payload.route.startsWith("/") ? payload.route : `/${payload.route}`;
      if (variant === "staff") {
        const base = route.replace(/^\//, "").split("/")[0];
        if (ADMIN_ROUTES.has(base)) return `/admin${route}`;
      }
      return route;
    case "SHOW_RESERVATIONS":
      return "/admin/reservas";
    case "SHOW_ORDERS":
      return "/admin/ordenes";
    case "SHOW_WAITERS":
      return "/admin/meseros";
    case "SHOW_MENU":
      return variant === "staff" ? "/admin/platos" : "/carta";
    case "MANAGE_USERS":
      return "/admin/usuarios";
    default:
      return null;
  }
};

function getOrInitToken(variant) {
  const storageKey = variant === "staff" ? "lhl_chat_token_staff" : "lhl_chat_token";
  const storage = variant === "staff" ? localStorage : sessionStorage;
  let token = storage.getItem(storageKey);
  if (!token) {
    token = crypto.randomUUID
      ? crypto.randomUUID()
      : `${variant}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    storage.setItem(storageKey, token);
  }
  return token;
}

export const FloatingChatWidget = ({ variant = "public", userRole, clientId }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionToken] = useState(() => getOrInitToken(variant));
  const [executingActionId, setExecutingActionId] = useState(null);

  const initialText =
    variant === "staff"
      ? "Asistente interno activo. ¿En qué te ayudo con la operación?"
      : "¡Hola! Bienvenido al LocalHost Lounge. ¿En qué te puedo ayudar hoy?";

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: initialText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputValue,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const role = variant === "staff" ? userRole || "ADMIN" : "CLIENTE";
      const response = await axiosClient.post("/chat/web", {
        sessionToken,
        clientId: clientId || undefined,
        message: userMessage.text,
        role,
      });

      const data = response.data;

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data?.reply || "Entendido.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        action: data?.action,
        payload: data?.payload,
        actionStatus: "pending",
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data?.action === "PREFILL_RESERVATION") {
        setIsOpen(false);
        setTimeout(
          () => navigate("/reservar", { state: { aiData: data.payload } }),
          600,
        );
      } else if (data?.action && AUTO_ACTIONS.has(data.action)) {
        const route = getRouteFromAction(data.action, data.payload, variant);
        if (route) setTimeout(() => navigate(route), 600);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Hubo un error de conexión con mi servidor. Intenta de nuevo.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAction = async (msg) => {
    setExecutingActionId(msg.id);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, actionStatus: "confirmed" } : m,
      ),
    );

    try {
      let successText = "Acción ejecutada correctamente.";
      let followUpAction = null;

      if (msg.action === "CREATE_WAITER") {
        const created = msg.payload?.waiter || msg.payload || {};
        successText = `Mesero ${created.name || ""} creado exitosamente.`;
        followUpAction = "SHOW_WAITERS";
      } else if (msg.action === "CREATE_TABLE") {
        const created = msg.payload?.table || msg.payload || {};
        successText = `Mesa ${created.table_number || ""} registrada correctamente.`;
        followUpAction = "RENDER_TABLE_STATUS";
      } else if (msg.action === "CREATE_PLATE") {
        const created = msg.payload?.plate || msg.payload || {};
        successText = `Plato "${created.name || ""}" añadido al menú.`;
        followUpAction = "SHOW_MENU";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          text: successText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      if (followUpAction) {
        const followUpResponse = await axiosClient.post("/chat/web", {
          sessionToken,
          clientId: clientId || undefined,
          message: `trigger ${followUpAction}`,
          role: userRole || "ADMIN",
        });
        const data = followUpResponse.data;
        if (data) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: "bot",
              text: data?.reply || "",
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              action: data?.action,
              payload: data?.payload,
            },
          ]);
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          text:
            "Error al ejecutar: " +
            (error.response?.data?.error || error.message),
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleCancelAction = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, actionStatus: "cancelled" } : m,
      ),
    );
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "bot",
        text: "Acción cancelada.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className="bg-card border border-border w-80 sm:w-96 rounded-md shadow-2xl mb-4 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300"
          style={{ height: '450px' }}
        >
          <div className="bg-secondary/50 border-b border-border p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <TerminalSquare size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">
                  {variant === "staff"
                    ? "Asistente Operativo"
                    : "Lounge Asistente"}
                </h3>
                <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-widest mt-1">
                  En línea
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
              <div key={msg.id} className="flex flex-col">
                <div
                  className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                      msg.sender === "user"
                        ? "bg-secondary text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User size={12} />
                    ) : (
                      <TerminalSquare size={12} />
                    )}
                  </div>
                  <div
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-3 py-2 text-sm rounded-md ${
                        msg.sender === "user"
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

                {msg.sender === "bot" && variant === "staff" && msg.action === "SHOW_DASHBOARD" && msg.payload?.dashboard && (
                  <div className="ml-9 mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-sm border border-border bg-background/80 p-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Mesas totales</p>
                      <p className="text-lg font-bold text-white">{msg.payload.dashboard.tables?.total ?? 0}</p>
                    </div>
                    <div className="rounded-sm border border-border bg-background/80 p-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Libres</p>
                      <p className="text-lg font-bold text-emerald-400">{msg.payload.dashboard.tables?.libres ?? 0}</p>
                    </div>
                    <div className="rounded-sm border border-border bg-background/80 p-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Ocupadas</p>
                      <p className="text-lg font-bold text-rose-400">{msg.payload.dashboard.tables?.ocupadas ?? 0}</p>
                    </div>
                    <div className="rounded-sm border border-border bg-background/80 p-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Reservas hoy</p>
                      <p className="text-lg font-bold text-white">{msg.payload.dashboard.reservations?.today_total ?? 0}</p>
                    </div>
                  </div>
                )}

                {msg.sender === "bot" && variant === "staff" && msg.action === "SHOW_MENU" && Array.isArray(msg.payload?.plates) && msg.payload.plates.length > 0 && (
                  <div className="ml-9 mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {msg.payload.plates.map((plate) => (
                      <div key={plate.id} className="rounded-sm border border-border bg-background/80 p-2 text-xs">
                        <p className="font-bold text-white">{plate.name}</p>
                        <p className="text-muted-foreground">{plate.category} · S/. {Number(plate.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {msg.sender === "bot" && variant === "staff" && msg.action === "RENDER_TABLE_STATUS" && Array.isArray(msg.payload?.tables) && (
                  <div className="ml-9 mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {msg.payload.tables.map((table) => (
                      <div key={table.id} className="rounded-sm border border-border bg-background/80 p-2 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white">Mesa {table.table_number}</span>
                          <span className="text-muted-foreground ml-1">· {table.type}</span>
                        </div>
                        <span className={`font-bold ${table.status === "LIBRE" ? "text-emerald-400" : table.status === "OCUPADO" ? "text-rose-400" : "text-amber-400"}`}>{table.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.sender === "bot" && variant === "staff" && msg.action === "SHOW_RESERVATIONS" && Array.isArray(msg.payload?.reservations) && (
                  <div className="ml-9 mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {msg.payload.reservations.length > 0 ? msg.payload.reservations.slice(0, 5).map((res) => (
                      <div key={res.id} className="rounded-sm border border-border bg-background/80 p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-bold text-white">#{res.id}</span>
                          <span className="text-primary font-bold">{res.status}</span>
                        </div>
                        <p className="text-muted-foreground">{res.client?.name} {res.client?.last_name}</p>
                        <p className="text-muted-foreground">Mesa {res.table?.table_number || res.table_id} · {res.reservation_date}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground ml-9">Sin resultados</p>}
                  </div>
                )}

                {msg.sender === "bot" && variant === "staff" && msg.action === "SHOW_ORDERS" && Array.isArray(msg.payload?.orders) && (
                  <div className="ml-9 mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {msg.payload.orders.length > 0 ? msg.payload.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="rounded-sm border border-border bg-background/80 p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-bold text-white">#{order.id}</span>
                          <span className="text-primary font-bold">{order.status}</span>
                        </div>
                        <p className="text-muted-foreground">Mesa {order.table?.table_number || order.table_id}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground ml-9">Sin resultados</p>}
                  </div>
                )}

                {msg.sender === "bot" && variant === "staff" && msg.action === "SHOW_WAITERS" && Array.isArray(msg.payload?.waiters) && (
                  <div className="ml-9 mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {msg.payload.waiters.map((waiter) => (
                      <div key={waiter.id} className="rounded-sm border border-border bg-background/80 p-2 text-xs">
                        <p className="font-bold text-white">{waiter.name}</p>
                        <p className="text-muted-foreground">{waiter.phone_number || "Sin teléfono"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {msg.sender === "bot" &&
                  msg.action &&
                  ACTION_REQUIRES_CONFIRMATION.has(msg.action) &&
                  msg.actionStatus === "pending" && (
                    <div className="ml-9 mt-2 flex gap-2">
                      <button
                        onClick={() => handleConfirmAction(msg)}
                        disabled={executingActionId === msg.id}
                        className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-sm flex items-center gap-1 font-bold transition-all hover:bg-primary/90 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        {executingActionId === msg.id
                          ? "Procesando..."
                          : "Confirmar"}
                      </button>
                      <button
                        onClick={() => handleCancelAction(msg.id)}
                        disabled={executingActionId === msg.id}
                        className="bg-secondary text-muted-foreground hover:text-white border border-border text-xs px-3 py-1.5 rounded-sm flex items-center gap-1 font-bold transition-all disabled:opacity-50"
                      >
                        <XCircle size={14} /> Cancelar
                      </button>
                    </div>
                  )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-1 bg-primary text-primary-foreground">
                  <TerminalSquare size={12} />
                </div>
                <div className="px-3 py-2 text-sm rounded-md bg-secondary border border-border text-white rounded-tl-none flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-150"></span>
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
              placeholder="Escribe tu comando..."
              disabled={isTyping}
              className="flex-1 bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-sm transition-colors disabled:opacity-50"
            >
              <Send size={16} />
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
