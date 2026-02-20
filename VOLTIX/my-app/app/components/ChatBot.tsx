"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { X, Send, MessageCircle, Mic, Zap } from "lucide-react";
import api from "@/app/config/api";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    {
      sender: "bot",
      text: "⚡ Hello! I'm your EV Charging Station AI Assistant. I can help you understand our intelligent infrastructure, agent decisions, ML predictions, and system operations. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Speech recognition (English only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition)
      return console.warn("Speech recognition not supported.");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      recognition.stop();
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current)
      return alert("Speech recognition not supported in this browser.");
    setListening(true);
    recognitionRef.current.start();
  };

  const getVoiceForLang = () => {
    if (!voices.length) return null;
    return (
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith("en") &&
          v.name.toLowerCase().includes("india"),
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      null
    );
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoiceForLang() || voices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await api.post("/api/chat", { message: userMessage });
      const data = res.data; // Axios returns data in .data
      const botReply = data.reply || "No reply from EV Station Assistant.";

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
        speakText(botReply);
      }, 700);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Unable to connect to EV Station Assistant. Please check your connection.",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-400/50 flex items-center justify-center text-white z-50 hover:shadow-green-400/30 hover:scale-105 transition-all border border-green-300"
          >
            <Zap size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 h-[600px] w-[400px] bg-background/80 backdrop-blur-xl border border-green-500/30 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 backdrop-blur-md text-white p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Zap size={20} className="text-yellow-300 fill-yellow-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide">
                    VOLTIX AI
                  </h3>
                  <p className="text-[10px] opacity-90 font-medium text-green-50">
                    System Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                aria-label="Close ChatBot"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                      : "bg-muted/80 backdrop-blur-sm text-foreground rounded-tl-sm border border-border/50 shadow-sm"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs px-4 py-2 ml-2">
                  <span
                    className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-border/40 bg-background/40 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={startListening}
                  className={`p-2.5 rounded-full transition-all ${
                    listening
                      ? "bg-red-500 text-white shadow-md animate-pulse"
                      : "text-muted-foreground hover:bg-background/80 hover:text-primary"
                  }`}
                  aria-label="Start voice input"
                >
                  <Mic size={18} />
                </motion.button>

                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 px-2"
                  placeholder="Ask VOLTIX..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="p-2.5 bg-primary text-primary-foreground rounded-full shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.4);
          border-radius: 10px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: rgba(96, 165, 250, 0.8);
          border-radius: 50%;
          animation: blink 1.4s infinite both;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
