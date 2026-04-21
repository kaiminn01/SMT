"use client";
import React, { useState } from "react";
import { Button, Card, CopyButton, SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input } from "@/components/ui";
import { useClient } from "@/lib/client-context";
import type { ScoutedTweet, ScoutResponse } from "@/app/api/scout/route";

const TONES = ["conversational", "non-shilly", "witty", "casual", "crypto-native", "aggressive"];

export default function RepliesTab() {
  const { activeClient } = useClient();
  const [count, setCount] = useState("10");
  const [hours, setHours] = useState("6");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>(["non-shilly", "conversational"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoutResponse | null>(null);

  const effectiveKeywords = keywords.length > 0 ? keywords : activeClient.keywords;

  const addKeyword = () => {
    const v = keywordInput.trim();
    if (v && !keywords.includes(v)) setKeywords([...keywords, v]);
    setKeywordInput("");
  };

  const toggleTone = (t: string) => setTones(p => p.includes(t) ? (p.length > 1 ? p.filter(x => x !== t) : p) : [...p, t]);

  const handleScout = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/scout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: parseInt(count) || 10, hours: parseInt(hours) || 6, keywords: effectiveKeywords, tones }),
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionLabel>number of tweets</SectionLabel>
            <Input placeholder="10" value={count} onChange={setCount} className="mt-1.5" />
          </div>
          <div>
            <SectionLabel>hours back</SectionLabel>
            <Input placeholder="6" value={hours} onChange={setHours} className="mt-1.5" />
          </div>
        </div>

        <div>
          <SectionLabel>keywords</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {effectiveKeywords.map(kw => (
              <span key={kw} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${keywords.includes(kw) ? "bg-accent/15 border-accent/25 text-accent" : "bg-surface-3 border-white/8 text-muted"}`}>
                {kw}
                {keywords.includes(kw) && <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="text-accent/50 hover:text-accent">×</button>}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="add keyword..." value={keywordInput} onChange={setKeywordInput} onKeyDown={e => e.key === "Enter" && addKeyword()} className="flex-1" />
            <Button onClick={addKeyword} variant="secondary">Add</Button>
          </div>
          {keywords.length === 0 && <p className="text-xs text-muted mt-1 font-mono">using {activeClient.label} defaults</p>}
        </div>

        <div>
          <SectionLabel>reply tone</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {TONES.map(t => (
              <button key={t} onClick={() => toggleTone(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${tones.includes(t) ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleScout} loading={loading}>{loading ? "Searching X..." : "↯ Find Tweets"}</Button>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-surface-2 border border-white/6 flex items-center gap-3">
            <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            <p className="text-xs font-mono text-muted">finding real tweets on X...</p>
          </div>
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>live context</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{result.meta_context}</p>
            <p className="text-[10px] font-mono text-muted mt-1">{result.timeframe_used} · {result.keyword_used}</p>
          </div>
          {result.tweets?.map((tweet, i) => <TweetCard key={i} tweet={tweet} index={i + 1} />)}
        </div>
      )}
      {!loading && !result && !error && <EmptyState icon="↩" message="set your keywords and find real tweets to engage with" />}
    </div>
  );
}

function TweetCard({ tweet, index }: { tweet: ScoutedTweet; index: number }) {
  const qualityColor = tweet.author_quality === "verified" ? "text-ok border-ok/30 bg-ok/10"
    : tweet.author_quality === "high-followers" ? "text-electric border-electric/30 bg-electric/10"
    : "text-muted border-white/10 bg-surface-3";

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted">#{index}</span>
          <span className="text-sm font-semibold text-ink">{tweet.author_handle}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${qualityColor}`}>{tweet.author_quality}</span>
        </div>
      </div>

      <p className="text-sm text-ink/80 leading-relaxed">{tweet.tweet_summary}</p>

      {/* Links */}
      <div className="flex gap-2 flex-wrap">
        {tweet.tweet_url && tweet.tweet_url !== "null" && (
          <a href={tweet.tweet_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d9bf0]/15 border border-[#1d9bf0]/30 text-[#1d9bf0] text-xs font-mono hover:bg-[#1d9bf0]/25 transition-all">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><path d="M8.5 1h1.6L6.6 4.8 10.7 10H7.3L4.7 6.7 1.7 10H.1L3.5 6 -.1 1h3.5l2.3 3 2.8-3zm-.6 8.1h.9L3.2 1.9h-.9l5.6 7.2z"/></svg>
            view tweet →
          </a>
        )}
        {tweet.google_search_url && (
          <a href={tweet.google_search_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 border border-white/8 text-muted text-xs font-mono hover:text-ink transition-all">
            🌐 more context →
          </a>
        )}
      </div>

      {/* Reply angles */}
      <div className="space-y-2">
        <SectionLabel>reply angles</SectionLabel>
        {tweet.reply_angles?.map((r, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-2 border border-white/6 group">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-muted mr-2">{r.tone}</span>
              <p className="text-xs text-ink/80 leading-relaxed mt-0.5">{r.text}</p>
            </div>
            <CopyButton text={r.text} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </Card>
  );
}
