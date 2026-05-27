import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageCirclePlus } from "lucide-react";
import { api } from "../lib/api";
import { Typewriter } from "./Typewriter";

type Message = { role: "user" | "assistant"; content: string };

type Conversation = { id: string; title: string | null; created_at: string };
type StoredMessage = { role: string; content: string; created_at: string };

export const VaultChat = ({ vaultId }: { vaultId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Messages with index >= newFromIndex are "fresh" (typed by user in this session)
  // and the assistant's reply gets the typewriter effect. History loads instantly.
  const [newFromIndex, setNewFromIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    setMessages([]);
    setConversationId(undefined);
    (async () => {
      try {
        const { data } = await api.get<{ conversations: Conversation[] }>(
          `/vaults/${vaultId}/conversations`
        );
        const latest = data.conversations[0];
        if (!latest || cancelled) return;
        const msgRes = await api.get<{ messages: StoredMessage[] }>(
          `/vaults/${vaultId}/conversations/${latest.id}/messages`
        );
        if (cancelled) return;
        setConversationId(latest.id);
        const loaded = msgRes.data.messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user" as "user" | "assistant",
          content: m.content,
        }));
        setMessages(loaded);
        setNewFromIndex(loaded.length);
      } catch {
        // si no hay historial, simplemente arrancamos vacíos
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vaultId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setSending(true);
    try {
      const { data } = await api.post(`/vaults/${vaultId}/chat`, {
        message: userMsg,
        conversation_id: conversationId,
      });
      setConversationId(data.conversation_id);
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="card flex flex-col h-[560px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-2xl text-warm-plum flex items-center gap-2">
          <Sparkles size={18} className="text-warm-accent" />
          Conversar
        </h3>
        {(messages.length > 0 || conversationId) && (
          <button
            type="button"
            onClick={startNewConversation}
            className="text-xs font-bold text-warm-olive hover:text-warm-accent transition flex items-center gap-1.5"
          >
            <MessageCirclePlus size={14} /> Nueva
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {loadingHistory && (
          <div className="space-y-2">
            <div className="h-12 w-3/4 bg-warm-fog rounded-2xl animate-pulse" />
            <div className="h-12 w-5/6 bg-warm-fog rounded-2xl ml-auto animate-pulse" />
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 rounded-2xl bg-warm-light mx-auto mb-3 flex items-center justify-center">
              <Sparkles size={22} className="text-warm-accent" />
            </div>
            <p className="text-sm text-warm-olive italic max-w-xs mx-auto leading-relaxed">
              Escribe una pregunta — la IA responderá basándose en la biografía y los
              archivos que subiste.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isFresh = i >= newFromIndex && m.role === "assistant";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-warm-accent text-white rounded-br-sm"
                    : "bg-warm-fog text-warm-plum rounded-bl-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  <Typewriter text={m.content} animate={isFresh} />
                ) : (
                  m.content
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-warm-fog text-warm-olive italic text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm w-fit flex items-center gap-1"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warm-olive animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warm-olive animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warm-olive animate-bounce" style={{ animationDelay: "300ms" }} />
          </motion.div>
        )}
        {error && (
          <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Escribe tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || loadingHistory}
        />
        <motion.button
          type="submit"
          disabled={sending || loadingHistory || !input.trim()}
          whileTap={{ scale: 0.95 }}
          className="btn-primary px-4"
          aria-label="Enviar"
        >
          <Send size={16} />
        </motion.button>
      </form>
    </div>
  );
};
