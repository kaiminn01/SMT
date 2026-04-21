"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button, Card, CopyButton, ErrorBox, SectionLabel, Textarea } from "@/components/ui";

interface Message { role: "user" | "assistant"; content: string; }

const STARTERS = [
  "How does the Trends tab work?",
  "What's the difference between Tab 1 and Tab 2?",
  "How do I save a post to Notion?",
  "What's the current state of prediction markets on Base?",
  "Compare OmenX vs Polymarket positioning",
  "What are the best GTM tactics for SEA crypto audiences?",
  "Update my Brand Voice page to add 'alpha' to vocabulary",
];

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:500;margin:1em 0 0.4em;color:var(--color-text-primary)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.05rem;font-weight:500;margin:1.2em 0 0.5em;color:var(--color-text-primary)">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text-primary);font-weight:500">$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--color-background-secondary);padding:0.1em 0.4em;border-radius:3px;font-family:monospace;font-size:0.85em">$1</code>')
    .replace(/^\- (.+)$/gm, '<li style="margin-bottom:0.25em;color:var(--color-text-secondary)">$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul style="padding-left:1.25em;margin:0.5em 0">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin-bottom:0.75em;color:var(--color-text-secondary);line-height:1.7">')
    .replace(/^(?!<[hul])(.+)$/gm, '<p style="margin-bottom:0.75em;color:var(--color-text-secondary);line-height:1.7">$1</p>');
}

export default function AssistantTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true); setError(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col space-y-4" style={{ minHeight: "calc(100vh - 150px)" }}>
      <div className="flex-1">
        {messages.length === 0 && !loading ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-3xl mb-3 opacity-30">◈</div>
              <p className="text-sm text-muted font-mono">research assistant + tool support + notion agent</p>
              <p className="text-xs text-muted/60 mt-1">ask about the tool, research anything, or update your Notion</p>
            </div>
            <div>
              <SectionLabel>try asking</SectionLabel>
              <div className="mt-2 space-y-2">
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-surface-2 border border-white/6 text-xs font-mono text-muted hover:text-ink hover:border-accent/25 hover:bg-surface-3 transition-all">
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 animate-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-mono ${msg.role === "user" ? "bg-surface-4 border border-white/12 text-muted" : "bg-accent/20 border border-accent/30 text-accent"}`}>
                  {msg.role === "user" ? "you" : "AI"}
                </div>
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                  {msg.role === "user" ? (
                    <div className="px-4 py-2.5 rounded-xl rounded-tr-sm bg-surface-3 border border-white/8">
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-2 border border-white/6">
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      </div>
                      <CopyButton text={msg.content} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-mono text-accent">AI</div>
                <div className="flex items-center gap-1.5 pt-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      <Card className="p-4 space-y-3 sticky bottom-0">
        <Textarea placeholder="ask anything — research, tool help, or update your Notion..." value={input} onChange={setInput} rows={3} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError(null); }} className="text-xs font-mono text-muted hover:text-warn transition-colors">clear chat</button>
            )}
            {messages.length > 0 && <CopyButton text={messages.map(m => `${m.role}: ${m.content}`).join("\n\n")} />}
          </div>
          <Button onClick={() => sendMessage()} loading={loading} disabled={!input.trim()}>{loading ? "Thinking..." : "Send →"}</Button>
        </div>
      </Card>
    </div>
  );
}
