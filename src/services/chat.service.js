import axiosClient from "../api/axiosClient";

const CHAT_SCOPES = {
  public: {
    storageKey: "lhl_chat_messages_public_ai",
    seed: [
      {
        id: 1,
        sender: "Lounge Asistente",
        role: "BOT",
        text: "Hola, soy tu asistente virtual. Te ayudo con carta, reservas y horarios.",
        time: "08:00",
      },
    ],
  },
  staff: {
    storageKey: "lhl_chat_messages_staff_ai",
    seed: [
      {
        id: 1,
        sender: "Asistente Operativo IA",
        role: "BOT",
        text: "Asistente interno activo. Puedo ayudarte con flujo operativo y dudas de reservas.",
        time: "08:00",
      },
    ],
  },
};

const WEB_SESSION_KEYS = {
  staff: "lhl_chat_session_staff_ai",
  public: "lhl_chat_session_public_ai",
};

const UPDATE_EVENT = "lhl_chat_updated";

const getNowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const parseMessages = (raw) => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const getScopeConfig = (scope) => CHAT_SCOPES[scope] || CHAT_SCOPES.public;

const notify = (scope, messages) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT, {
      detail: { scope, messages },
    }),
  );
};

const normalizePrompt = (text) => (text || "").trim().toLowerCase();

const getOrCreateSessionToken = (scope = "public") => {
  if (typeof window === "undefined") return `server-${scope}`;

  const storageKey = WEB_SESSION_KEYS[scope] || WEB_SESSION_KEYS.public;
  const existingToken = localStorage.getItem(storageKey);
  if (existingToken) return existingToken;

  const nextToken =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${scope}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(storageKey, nextToken);
  return nextToken;
};

const getPublicAssistantReply = (prompt) => {
  if (prompt.includes("reserva") || prompt.includes("mesa")) {
    return "Para reservar, usa el formulario de la página principal indicando fecha, hora y número de personas.";
  }

  if (prompt.includes("horario") || prompt.includes("hora")) {
    return "Atendemos según disponibilidad del lounge. Déjame tu consulta y el equipo te confirmará el horario exacto.";
  }

  if (prompt.includes("menu") || prompt.includes("menú") || prompt.includes("carta")) {
    return "Puedes revisar la carta en la sección Nuestra Carta. Si quieres, te recomiendo opciones según tu preferencia.";
  }

  return "Gracias por tu mensaje. Soy un asistente IA de apoyo y puedo orientarte sobre reservas, carta y atención general.";
};

const getStaffAssistantReply = (prompt) => {
  if (prompt.includes("reserva")) {
    return "Revisa el módulo de Reservas para confirmar estado, fecha y asignación de mesa antes del turno.";
  }

  if (prompt.includes("mesero") || prompt.includes("meseros")) {
    return "En el módulo Meseros puedes validar disponibilidad y carga por fecha para equilibrar asignaciones.";
  }

  if (prompt.includes("mesa") || prompt.includes("ocupacion") || prompt.includes("ocupación")) {
    return "Consulta Mesas para ver ocupadas, reservadas y libres. Prioriza liberar mesas con check-out pendiente.";
  }

  return "Asistente IA interno en línea. Puedo ayudarte con dudas operativas rápidas del panel staff.";
};

export const ChatService = {
  getMessages: (scope = "public") => {
    const { storageKey, seed } = getScopeConfig(scope);

    if (typeof window === "undefined") {
      return seed;
    }

    const parsed = parseMessages(localStorage.getItem(storageKey));
    if (parsed && parsed.length) {
      return parsed;
    }

    localStorage.setItem(storageKey, JSON.stringify(seed));
    return seed;
  },

  saveMessages: (scope = "public", messages) => {
    const { storageKey } = getScopeConfig(scope);

    if (typeof window === "undefined") return;

    localStorage.setItem(storageKey, JSON.stringify(messages));
    notify(scope, messages);
  },

  addMessage: (scope = "public", { sender, role = "USER", text, ...extra }) => {
    const nextMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      sender,
      role,
      text,
      time: getNowTime(),
      ...extra,
    };

    const current = ChatService.getMessages(scope);
    const next = [...current, nextMessage];
    ChatService.saveMessages(scope, next);

    return nextMessage;
  },

  updateMessage: (scope = "public", messageId, patch) => {
    const current = ChatService.getMessages(scope);
    const next = current.map((message) =>
      message.id === messageId ? { ...message, ...patch } : message,
    );

    ChatService.saveMessages(scope, next);
    return next.find((message) => message.id === messageId) || null;
  },

  sendWebMessage: async ({ scope = "staff", message, role = "ADMIN", clientId }) => {
    const sessionToken = getOrCreateSessionToken(scope);
    const response = await axiosClient.post("/chat/web", {
      sessionToken,
      clientId,
      message,
      role,
    });

    return response.data?.data ?? response.data ?? null;
  },

  getAssistantReply: (scope = "public", text) => {
    const prompt = normalizePrompt(text);
    if (scope === "staff") {
      return getStaffAssistantReply(prompt);
    }

    return getPublicAssistantReply(prompt);
  },

  subscribe: (scope = "public", listener) => {
    const { storageKey } = getScopeConfig(scope);

    if (typeof window === "undefined") return () => {};

    const handleCustomUpdate = (event) => {
      if (!event.detail || event.detail.scope !== scope) return;

      const payload = Array.isArray(event.detail.messages)
        ? event.detail.messages
        : ChatService.getMessages(scope);
      listener(payload);
    };

    const handleStorage = (event) => {
      if (event.key !== storageKey) return;
      listener(ChatService.getMessages(scope));
    };

    window.addEventListener(UPDATE_EVENT, handleCustomUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleCustomUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  },
};
