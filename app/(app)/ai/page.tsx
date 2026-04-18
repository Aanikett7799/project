"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Send, Trash2, FileText, Loader2, User, Sparkles, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Explain the Pomodoro technique",
  "Help me make a study plan for exams",
  "What are effective note-taking strategies?",
  "Summarize my notes and give key insights",
  "How to improve focus and productivity?",
  "Create a weekly study schedule for me",
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useNotes, setUseNotes] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/ai/chat");
      const data = await res.json();
      setMessages(data);
    } catch {
      toast.error("Failed to load chat history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (msg?: string) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, useNotes }),
      });
      const data = await res.json();
      // Replace with actual history
      setMessages(data.history || []);
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/ai/chat", { method: "DELETE" });
      setMessages([]);
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-lumina-cyan" />
            AI Study Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Powered by Ollama (llama3) — runs locally</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseNotes((n) => !n)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              useNotes
                ? "bg-lumina-blue/20 border-lumina-blue/40 text-lumina-blue"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3 h-3" />
            Use my notes
          </button>
          {messages.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearHistory} className="gap-1.5 text-muted-foreground">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Ollama notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 shrink-0">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300/80">
          Requires Ollama running locally. Run: <code className="bg-black/30 px-1 rounded">ollama serve</code> and{" "}
          <code className="bg-black/30 px-1 rounded">ollama pull llama3</code>
        </p>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lumina-cyan/20 to-lumina-purple/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-lumina-cyan" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-lumina-cyan/10 to-lumina-purple/10 rounded-2xl blur-lg" />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1">Ask me anything about your studies</p>
                <p className="text-sm text-muted-foreground">Your local AI assistant — no data leaves your machine</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-secondary/30 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 animate-fadeIn",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-primary/20"
                      : "bg-gradient-to-br from-lumina-cyan/20 to-lumina-purple/20"
                  )}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4 text-primary" />
                      : <Sparkles className="w-4 h-4 text-lumina-cyan" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3",
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground rounded-tr-sm"
                      : "bg-secondary/40 text-foreground rounded-tl-sm"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                      {format(new Date(msg.timestamp), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lumina-cyan/20 to-lumina-purple/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-lumina-cyan" />
                  </div>
                  <div className="bg-secondary/40 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border/50 p-4 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder="Ask anything... (Shift+Enter for newline)"
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="w-11 h-11 shrink-0 rounded-xl"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {useNotes && (
            <p className="text-[10px] text-lumina-blue mt-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Using your notes as context
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
