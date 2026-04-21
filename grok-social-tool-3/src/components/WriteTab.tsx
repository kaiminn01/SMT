"use client";
import React, { useState } from "react";
import { Button, Card, CopyButton, SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input } from "@/components/ui";
import { useClient } from "@/lib/client-context";
import type { ContentAngle, WriteAnglesResponse, WritePostResponse } from "@/app/api/write/route";

const PLATFORMS = ["X", "LinkedIn", "Instagram", "Discord", "Newsletter"];
const AUDIENCES = ["Traders", "Builders", "DeFi Users", "Crypto Beginners", "SEA Audience", "General Crypto", "Community"];
const HOOK_COLORS: Record<string, string> = {
  Contrarian: "text-warn border-warn/30 bg-warn/10",
  Proof: "text-ok border-ok/30 bg-ok/10",
  Insider: "text-electric border-electric/30 bg-electric/10",
  Replacement: "text-accent border-accent/30 bg-accent/10",
  Discovery: "text-muted border-white/15 bg-surface-3",
};

export default function WriteTab() {
  const { activeClient } = useClient();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("X");
  const [audience, setAudience] = useState<string[]>(["Traders"]);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [angles, setAngles] = useState<ContentAngle[] | null>(null);
  const [researchContext, setResearchContext] = useState("");
  const [selectedAngle, setSelectedAngle] = useState<ContentAngle | null>(null);
  const [post, setPost] = useState<WritePostResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleAudience = (a: string) => setAudience(p => p.includes(a) ? (p.length > 1 ? p.filter(x => x !== a) : p) : [...p, a]);

  const handleGenerateAngles = async () => {
    setLoading(true); setError(null); setAngles(null); setSelectedAngle(null); setPost(null);
    try {
      const res = await fetch("/api/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "angles", topic, platform, audience, client: activeClient.id }),
      });
      const data = await res.json() as WriteAnglesResponse;
      if (!res.ok) throw new Error((data as any).error ?? "API error");
      setAngles(data.angles);
      setResearchContext(data.research_context);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setLoading(false); }
  };

  const handleWrite = async (angle: ContentAngle, refineMode?: string) => {
    setSelectedAngle(angle); setWriting(true); setPost(null); setSaved(false);
    try {
      const res = await fetch("/api/write", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: refineMode ? "refine" : "write", topic, platform, audience, angle, client: activeClient.id, refineMode }),
      });
      const data = await res.json() as WritePostResponse;
      if (!res.ok) throw new Error((data as any).error ?? "API error");
      setPost(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error"); }
    finally { setWriting(false); }
  };

  const handleSaveToNotion = async () => {
    if (!post || !selectedAngle) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notion-save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.post.slice(0, 80),
          content: post.post,
          platform: post.platform,
          hookType: post.hook_type,
          topic: topic || "auto",
          client: activeClient.id,
          audience: audience.join(", "),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Save to Notion failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div>
          <SectionLabel>topic</SectionLabel>
          <Input placeholder={`leave blank → auto-research what's relevant for ${activeClient.label} right now`} value={topic} onChange={setTopic} className="mt-1.5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SectionLabel>platform</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${platform === p ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>audience (multi-select)</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {AUDIENCES.map(a => (
                <button key={a} onClick={() => toggleAudience(a)}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${audience.includes(a) ? "bg-electric/20 border-electric/40 text-electric" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateAngles} loading={loading}>{loading ? "Researching + generating angles..." : "↯ Generate Angles"}</Button>
          <p className="text-xs text-muted font-mono">reads your Notion Content OS automatically</p>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-surface-2 border border-white/6 flex items-center gap-3">
            <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            <p className="text-xs font-mono text-muted">reading Notion Content OS + searching live web...</p>
          </div>
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {angles && !loading && (
        <div className="space-y-4 animate-in">
          {researchContext && (
            <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
              <SectionLabel>research context — live</SectionLabel>
              <p className="mt-1 text-sm text-ink/80 leading-relaxed">{researchContext}</p>
            </div>
          )}
          <SectionLabel>pick an angle to develop</SectionLabel>
          {angles.map((angle, i) => (
            <AngleCard key={i} angle={angle} onSelect={() => handleWrite(angle)} selected={selectedAngle?.id === angle.id} />
          ))}
        </div>
      )}

      {(writing || post) && selectedAngle && (
        <div className="space-y-4 animate-in">
          <div className="flex items-center justify-between">
            <SectionLabel>generated post — {platform}</SectionLabel>
            {post && <CopyButton text={post.post} />}
          </div>
          {writing ? (
            <div className="p-4 rounded-lg bg-surface-2 border border-white/8 flex items-center gap-3">
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-ok/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
              <p className="text-xs font-mono text-muted">writing in your voice...</p>
            </div>
          ) : post ? (
            <>
              <div className="p-4 rounded-lg bg-surface-2 border border-white/8">
                <pre className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-sans">{post.post}</pre>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
                  <span className="text-[10px] font-mono text-muted">{post.hook_type} hook</span>
                  <span className="text-[10px] font-mono text-muted">{post.word_count} words</span>
                  <span className={`text-[10px] font-mono ${post.post.length > 250 ? "text-warn" : "text-ok"}`}>{post.post.length}c</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleWrite(selectedAngle, "sharper")} variant="secondary" loading={writing}>Make it sharper</Button>
                <Button onClick={() => handleWrite(selectedAngle, "degen")} variant="secondary" loading={writing}>More degen</Button>
                <Button onClick={() => handleWrite(selectedAngle, "beginner")} variant="secondary" loading={writing}>More beginner-friendly</Button>
                <Button onClick={handleSaveToNotion} loading={saving} variant={saved ? "secondary" : "primary"}>
                  {saved ? "✓ Saved to Notion" : "Save to Notion"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {!loading && !angles && !error && <EmptyState icon="✍" message="enter a topic and generate content angles" />}
    </div>
  );
}

function AngleCard({ angle, onSelect, selected }: { angle: ContentAngle; onSelect: () => void; selected: boolean }) {
  const hookStyle = HOOK_COLORS[angle.hook_type] ?? HOOK_COLORS.Discovery;
  return (
    <Card className={`p-4 space-y-2 cursor-pointer transition-all hover:border-accent/30 ${selected ? "border-accent/50 bg-accent/5" : ""}`} onClick={onSelect}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${hookStyle}`}>{angle.hook_type}</span>
          <span className="text-xs font-mono text-muted">{angle.platform_format}</span>
          <span className="text-xs font-mono text-muted">→ {angle.audience}</span>
        </div>
        <button className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${selected ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-3 border-white/8 text-muted hover:text-ink hover:border-accent/30"}`}>
          {selected ? "writing..." : "write this →"}
        </button>
      </div>
      <p className="text-sm text-ink font-medium leading-relaxed">{angle.angle}</p>
      <p className="text-xs text-muted italic">{angle.why_it_works}</p>
      {angle.supporting_reference && (
        <p className="text-xs text-ink/60 leading-relaxed">↳ {angle.supporting_reference}</p>
      )}
    </Card>
  );
}
