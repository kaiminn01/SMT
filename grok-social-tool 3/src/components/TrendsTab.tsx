"use client";
import React, { useState } from "react";
import { Button, Card, CopyButton, SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input } from "@/components/ui";
import { useClient } from "@/lib/client-context";
import type { TrendTopic, TrendsResponse } from "@/app/api/trends/route";

type ScanMode = "general" | "keyword";
type Timeframe = "last 6h" | "last 24h" | "last 48h";

const CATEGORY_STYLES: Record<string, string> = {
  crypto: "text-accent border-accent/30 bg-accent/10",
  markets: "text-ok border-ok/30 bg-ok/10",
  AI: "text-electric border-electric/30 bg-electric/10",
  politics: "text-warn border-warn/30 bg-warn/10",
  regulation: "text-warn border-warn/30 bg-warn/10",
  macro: "text-electric border-electric/30 bg-electric/10",
  sports: "text-ok border-ok/30 bg-ok/10",
};

const MOMENTUM_STYLES: Record<string, string> = {
  High: "text-ok border-ok/30 bg-ok/10",
  Medium: "text-electric border-electric/30 bg-electric/10",
  Low: "text-muted border-white/10 bg-surface-3",
};

export default function TrendsTab() {
  const { activeClient } = useClient();
  const [mode, setMode] = useState<ScanMode>("general");
  const [timeframe, setTimeframe] = useState<Timeframe>("last 24h");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendsResponse | null>(null);

  const effectiveKeywords = keywords.length > 0 ? keywords : activeClient.keywords;

  const addKeyword = () => {
    const v = inputVal.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setInputVal("");
  };

  const handleScan = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/trends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: mode === "keyword" ? effectiveKeywords : [], client: activeClient.id, mode, timeframe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div>
          <SectionLabel>scan mode</SectionLabel>
          <div className="flex gap-1 p-1 bg-surface-2 rounded-lg w-fit mt-2">
            {([["general", "↯ What's Trending Now"], ["keyword", "⌖ Keyword Focus"]] as [ScanMode, string][]).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-md text-xs font-mono transition-all ${mode === m ? "bg-accent text-white shadow-accent-sm" : "text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          {mode === "general" && <p className="text-xs text-muted font-mono mt-2">↳ searches live web — news, crypto, politics, markets, tech, AI</p>}
        </div>

        <div>
          <SectionLabel>time filter</SectionLabel>
          <div className="flex gap-2 mt-2 flex-wrap">
            {(["last 6h", "last 24h", "last 48h"] as Timeframe[]).map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${timeframe === t ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {mode === "keyword" && (
          <div>
            <SectionLabel>keywords</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {effectiveKeywords.map(kw => (
                <span key={kw} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${keywords.includes(kw) ? "bg-accent/15 border-accent/25 text-accent" : "bg-surface-3 border-white/8 text-muted"}`}>
                  {kw}
                  {keywords.includes(kw) && <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="text-accent/50 hover:text-accent">×</button>}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="add keyword..." value={inputVal} onChange={setInputVal} onKeyDown={e => e.key === "Enter" && addKeyword()} className="flex-1" />
              <Button onClick={addKeyword} variant="secondary">Add</Button>
            </div>
            {keywords.length === 0 && <p className="text-xs text-muted mt-1 font-mono">using {activeClient.label} defaults</p>}
          </div>
        )}

        <Button onClick={handleScan} loading={loading}>{loading ? "Searching live web..." : "↯ Scan Trends"}</Button>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-surface-2 border border-white/6 flex items-center gap-3">
            <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            <p className="text-xs font-mono text-muted">searching live web + validating on X...</p>
          </div>
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>macro signal — live</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{result.meta_summary}</p>
            <p className="text-[10px] font-mono text-muted mt-2">scanned {new Date(result.generated_at).toLocaleTimeString()}</p>
          </div>
          {result.topics.map((topic, i) => <TopicCard key={i} topic={topic} />)}
        </div>
      )}
      {!loading && !result && !error && <EmptyState icon="↯" message="hit scan to find what's trending right now" />}
    </div>
  );
}

function TopicCard({ topic }: { topic: TrendTopic }) {
  const catStyle = CATEGORY_STYLES[topic.category] ?? "text-muted border-white/10 bg-surface-3";
  const momStyle = MOMENTUM_STYLES[topic.momentum] ?? MOMENTUM_STYLES.Low;
  const hasTwitterLinks = Array.isArray(topic.twitter_links) && topic.twitter_links.length > 0;
  const allText = [topic.topic, topic.why_it_matters, topic.what_people_are_saying, "Reply angles:\n" + topic.reply_angles?.join("\n"), "Draft tweets:\n" + topic.draft_tweets?.join("\n")].filter(Boolean).join("\n\n");

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-ink">{topic.topic}</h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${catStyle}`}>{topic.category}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${momStyle}`}>{topic.momentum}</span>
        </div>
        <CopyButton text={allText} />
      </div>

      <p className="text-sm text-ink/70 leading-relaxed">{topic.why_it_matters}</p>

      {topic.what_people_are_saying && (
        <div className="p-3 rounded-lg bg-surface-2 border border-white/8">
          <SectionLabel>what people are saying</SectionLabel>
          <p className="mt-1 text-xs text-ink/70 leading-relaxed">{topic.what_people_are_saying}</p>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        {topic.web_links?.filter(l => l.url && l.url !== "null").map((link, i) => (
          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/8 text-muted text-xs font-mono hover:text-ink hover:border-white/15 transition-all max-w-xs truncate">
            🌐 {link.title || "web source"}
          </a>
        ))}
        {hasTwitterLinks ? (
          (topic.twitter_links as any[]).map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9bf0]/15 border border-[#1d9bf0]/30 text-[#1d9bf0] text-xs font-mono hover:bg-[#1d9bf0]/25 transition-all">
              𝕏 {link.handle} · {link.credibility}
            </a>
          ))
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-3 border border-white/6 text-muted text-xs font-mono">
            𝕏 No reliable X discussion found
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>reply angles</SectionLabel>
          <ul className="space-y-1.5">
            {topic.reply_angles?.map((a, i) => (
              <li key={i} className="flex items-start gap-2 group">
                <span className="text-accent/40 text-xs mt-0.5 shrink-0">→</span>
                <span className="text-xs text-ink/75 flex-1">{a}</span>
                <CopyButton text={a} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <SectionLabel>draft tweets — ready to post</SectionLabel>
          {topic.draft_tweets?.map((tweet, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-2 border border-white/8 group">
              <p className="text-xs text-ink flex-1 leading-relaxed">{tweet}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono ${tweet.length > 250 ? "text-warn" : "text-ok"}`}>{tweet.length}c</span>
                <CopyButton text={tweet} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
