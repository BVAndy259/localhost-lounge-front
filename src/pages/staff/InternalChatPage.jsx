import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { ChatService } from "../../services/chat.service";

export const InternalChatPage = () => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const prompt = inputValue.trim();
    ChatService.addMessage("staff", {
      sender: "Staff",
      role: "USER",
      text: prompt,
    });

    setTimeout(() => {
      ChatService.addMessage("staff", {
        sender: "Asistente Operativo IA",
        role: "BOT",
        text: ChatService.getAssistantReply("staff", prompt),
      });
    }, 550);

    setInputValue("");
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
                disabled={!inputValue.trim()}
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
