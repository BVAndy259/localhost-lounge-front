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
import { ReservationService } from "../../services/reservation.service";
import { TableService } from "../../services/table.service";

const ACTION_REQUIRES_CONFIRMATION = new Set([
  "CREATE_RESERVATION", // Quitamos la de cliente de aquí porque ahora redirigimos
]);

const AUTO_ACTIONS = new Set([
  "SHOW_DASHBOARD",
  "RENDER_TABLE_STATUS",
  "FIND_RESERVATION",
  "NAVIGATE_PAGE",
  "SHOW_RESERVATIONS",
  "SHOW_ORDERS",
  "SHOW_WAITERS",
  "MANAGE_USERS",
  "PREFILL_RESERVATION", // <--- NUEVA ACCIÓN AUTOMÁTICA
]);

const getRouteFromAction = (action, payload) => {
  switch (action) {
    case "SHOW_DASHBOARD":
      return "/admin";
    case "RENDER_TABLE_STATUS":
      return "/admin/mesas";
    case "FIND_RESERVATION":
      return `/admin/reservas?q=${encodeURIComponent(payload?.search_term || "")}`;
    case "NAVIGATE_PAGE":
      return payload?.route || null;
    case "SHOW_RESERVATIONS":
      return "/admin/reservas";
    case "SHOW_ORDERS":
      return "/admin/ordenes";
    case "SHOW_WAITERS":
      return "/admin/meseros";
    case "MANAGE_USERS":
      return "/admin/usuarios";
    default:
      return null;
  }
};

const resolveTableChoice = (text, tables = []) => {
  const normalizedText = text.trim().toLowerCase();
  const numberMatch = normalizedText.match(/(?:mesa\s*)?(\d+)/i);

  const exactChoice = tables.find((table) => {
    const tableNumber = String(table.table_number).toLowerCase();
    const tableId = String(table.id).toLowerCase();
    return normalizedText === tableNumber || normalizedText === tableId;
  });

  if (exactChoice) return exactChoice;

  if (numberMatch) {
    const choiceNumber = numberMatch[1];
    return (
      tables.find((table) => String(table.table_number) === choiceNumber) ||
      tables.find((table) => String(table.id) === choiceNumber) ||
      null
    );
  }

  return null;
};

export const FloatingChatWidget = ({ variant = "public", userRole }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionToken, setSessionToken] = useState("");
  const [executingActionId, setExecutingActionId] = useState(null);
  const [pendingReservation, setPendingReservation] = useState(null);

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
    if (variant === "public") {
      let token = sessionStorage.getItem("lhl_chat_token");
      if (!token) {
        token = `public-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        sessionStorage.setItem("lhl_chat_token", token);
      }
      setSessionToken(token);
    }
  }, [variant]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    if (pendingReservation?.available_tables?.length) {
      const selectedTable = resolveTableChoice(
        inputValue,
        pendingReservation.available_tables,
      );

      if (selectedTable) {
        const reservationData = {
          ...pendingReservation,
          table_id: selectedTable.id,
          table_number: selectedTable.table_number,
          table_type: selectedTable.type,
          table_capacity: selectedTable.capacity,
        };

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "user",
            text: inputValue,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          {
            id: Date.now() + 1,
            sender: "bot",
            text: `Mesa ${selectedTable.table_number} elegida. Te llevo al formulario para que confirmes la reserva.`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        setInputValue("");
        setPendingReservation(null);
        setIsOpen(false);
        setTimeout(() => navigate("/reservar", { state: { aiData: reservationData } }), 600);
        return;
      }
    }

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
        sessionToken: variant === "public" ? sessionToken : "staff-session",
        message: userMessage.text,
        role: role,
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

      if (data?.action === "PREFILL_RESERVATION" && data?.payload?.available_tables?.length) {
        setPendingReservation(data.payload);
      } else if (data?.action === "PREFILL_RESERVATION") {
        setIsOpen(false);
        setTimeout(
          () => navigate("/reservar", { state: { aiData: data.payload } }),
          600,
        );
      } else if (data?.action && AUTO_ACTIONS.has(data.action)) {
        const route = getRouteFromAction(data.action, data.payload);
        if (route) {
          setTimeout(() => navigate(route), 600);
        }
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
      // Lógica solo para el Staff ahora
      if (msg.action === "CREATE_RESERVATION") {
        const tablesRes = await TableService.getAll();
        const tables = tablesRes.data || [];
        const resolvedTableId =
          msg.payload.table_id ||
          tables.find(
            (t) => String(t.table_number) === String(msg.payload.table_number),
          )?.id ||
          1;

        await ReservationService.create({
          table_id: Number(resolvedTableId),
          reservation_date: msg.payload.reservation_date,
          reservation_time: msg.payload.reservation_time,
          number_people: Number(msg.payload.number_people || 2),
          notes: msg.payload.notes || "",
          client_data: msg.payload.client_data,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            text: "Reserva de staff creada correctamente.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setTimeout(() => navigate("/admin/reservas"), 1500);
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
        <div className="bg-card border border-border w-80 sm:w-96 rounded-md shadow-2xl mb-4 overflow-hidden flex flex-col h-112.5 animate-in slide-in-from-bottom-5 duration-300">
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

                {msg.sender === "bot" && msg.payload?.available_tables?.length ? (
                  <div className="ml-9 mt-3 grid grid-cols-1 gap-2">
                    {msg.payload.available_tables.map((table) => (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => {
                          if (!pendingReservation) return;
                          const reservationData = {
                            ...pendingReservation,
                            table_id: table.id,
                            table_number: table.table_number,
                            table_type: table.type,
                            table_capacity: table.capacity,
                          };

                          setMessages((prev) => [
                            ...prev,
                            {
                              id: Date.now(),
                              sender: "user",
                              text: `Mesa ${table.table_number}`,
                              time: new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            },
                            {
                              id: Date.now() + 1,
                              sender: "bot",
                              text: `Mesa ${table.table_number} elegida. Te llevo al formulario para que confirmes la reserva.`,
                              time: new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            },
                          ]);

                          setPendingReservation(null);
                          setIsOpen(false);
                          setTimeout(
                            () => navigate("/reservar", { state: { aiData: reservationData } }),
                            600,
                          );
                        }}
                        className="text-left rounded-md border border-border bg-background/90 px-3 py-2 transition-colors hover:border-primary hover:bg-primary/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              Mesa {table.table_number}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {table.type} · {table.capacity} pax
                            </div>
                          </div>
                          <span className="text-xs font-bold text-primary">Elegir</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

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
              placeholder="Escribe tu consulta..."
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
