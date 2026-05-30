import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, TerminalSquare, User } from "lucide-react";
import { ChatService } from "../../services/chat.service";

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

export const FloatingChatWidget = ({ variant = "public" }) => {
  const config = CHAT_VARIANTS[variant] || CHAT_VARIANTS.public;
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    ChatService.addMessage(config.scope, {
      sender: config.userName,
      role: "USER",
      text: prompt,
    });
    setInputValue("");

    setTimeout(() => {
      ChatService.addMessage(config.scope, {
        sender: config.title,
        role: "BOT",
        text: ChatService.getAssistantReply(config.scope, prompt),
      });
    }, 550);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-card border border-border w-80 sm:w-96 rounded-md shadow-2xl mb-4 overflow-hidden flex flex-col h-[450px] animate-in slide-in-from-bottom-5 duration-300">
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
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === "USER" ? "ml-auto flex-row-reverse" : ""}`}
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
            ))}
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
              className="flex-1 bg-secondary/50 border border-border text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
