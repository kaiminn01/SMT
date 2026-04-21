"use client";

import React, { useState } from "react";
import {
  Button, Card, CopyButton, Badge, ScoreBadge,
  SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input, Textarea, Collapsible
} from "@/components/ui";
import NotionSaveButton from "@/components/NotionSaveButton";
import { useNotionSave } from "@/lib/use-notion-save";
import { useClient } from "@/lib/client-context";
import type { KOLProfile, KOLResponse, KOLCategory } from "@/app/api/kol/route";

const QUICK_NICHES = [
  "DeFi / prediction markets",
  "Base ecosystem",
  "AI agents / Web3",
  "crypto trading",
  "SEA crypto / Web3",
  "BNB Chain",
  "sports betting / prediction",
];

const CATEGORY_STYLES: Record<KOLCategory, string> = {
  "Legitimacy":   "text-electric border-electric/30 bg-electric/10",
  "Explainer":    "text-ok border-ok/30 bg-ok/10",
  "Conversion":   "text-warn border-warn/30 bg-warn/10",
  "Hype / Event": "text-accent border-accent/30 bg-accent/10",
};

export default function KOLTab() {
  const { activeClient } = useClient();
  const { saveToNotion, getStatus } = useNotionSave();
  const [niche, setNiche] = useState("");
  const [accountList, setAccountList] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KOLResponse | null>(null);

  const handleSearch = async () => {
    const searchNiche = niche.trim() || activeClient.niche;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/kol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: searchNiche, account_list: accountList, client: activeClient.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div>
          <SectionLabel>quick niche</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {QUICK_NICHES.map((n) => (
              <button key={n} onClick={() => setNiche(n)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all
                  ${niche === n ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                {n}
              </button>
            ))}
          </div>
          <Input placeholder={`or type custom niche... (default: ${activeClient.niche})`} value={niche} onChange={setNiche} />
        </div>
        <div>
          <SectionLabel>known accounts to analyze (optional)</SectionLabel>
          <Textarea placeholder="@handle1, @handle2 — paste accounts you already know" value={accountList} onChange={setAccountList} rows={2} className="mt-2" />
        </div>
        <Button onClick={handleSearch} loading={loading} disabled={!niche.trim() && !accountList.trim() && !activeClient.niche}>
          {loading ? "Searching..." : "↯ Find KOLs"}
        </Button>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && <div className="space-y-3">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>}

      {result && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>landscape read</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{result.niche_summary}</p>
          </div>

          {/* Category legend */}
          <div className="flex flex-wrap gap-2">
            {(["Legitimacy","Explainer","Conversion","Hype / Event"] as KOLCategory[]).map((cat) => (
              <span key={cat} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono border ${CATEGORY_STYLES[cat]}`}>
                {cat}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.kols.map((kol, i) => (
              <KOLCard key={i} kol={kol} client={activeClient.id}
                saveStatus={getStatus(kol.handle)}
                onSave={() => saveToNotion({
                  type: "KOL",
                  name: kol.display_name,
                  handle: kol.handle,
                  niche: niche || activeClient.niche,
                  client: activeClient.id,
                  kol_category: kol.kol_category,
                  follower_range: kol.follower_range,
                  priority_score: kol.priority_score,
                  collaboration_fit: kol.collaboration_fit,
                  engagement_angle: kol.suggested_engagement_angle,
                  why_they_matter: kol.why_they_matter,
                  audience_type: kol.audience_type,
                })}
              />
            ))}
          </div>

          {result.outreach_tips?.length > 0 && (
            <Card className="p-5">
              <SectionLabel>outreach tips</SectionLabel>
              <ul className="mt-3 space-y-2">
                {result.outreach_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent font-mono text-xs mt-0.5 shrink-0">{i+1}.</span>
                    <span className="text-sm text-ink/75">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {!loading && !result && !error && <EmptyState icon="◎" message="enter a niche to find relevant KOLs" />}
    </div>
  );
}

function KOLCard({ kol, client, saveStatus, onSave }: {
  kol: KOLProfile;
  client: string;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onSave: () => void;
}) {
  const cleanHandle = kol.handle.replace(/^@/, "");
  const twitterUrl = `https://twitter.com/${cleanHandle}`;
  const categoryStyle = CATEGORY_STYLES[kol.kol_category] ?? "text-muted border-white/10 bg-surface-3";

  const copyText = [
    `${kol.display_name} ${kol.handle}`,
    `Category: ${kol.kol_category}`,
    `Why: ${kol.why_they_matter}`,
    `Audience: ${kol.audience_type}`,
    `Engagement: ${kol.suggested_engagement_angle}`,
    `DM: ${kol.outreach_dm}`,
  ].join("\n");

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{kol.display_name}</span>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono text-accent hover:text-electric transition-colors inline-flex items-center gap-1 group">
              {kol.handle}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="opacity-40 group-hover:opacity-100">
                <path d="M1.5 7.5l6-6M4 1.5h4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${categoryStyle}`}>
              {kol.kol_category}
            </span>
            <Badge label={kol.collaboration_fit} />
            <ScoreBadge score={kol.priority_score} />
            <span className="text-xs font-mono text-muted">{kol.follower_range}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <CopyButton text={copyText} />
          <NotionSaveButton status={saveStatus} onClick={onSave} />
        </div>
      </div>

      <p className="text-xs text-ink/70 leading-relaxed">{kol.why_they_matter}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>audience</SectionLabel>
          <p className="mt-1 text-xs text-ink/60">{kol.audience_type}</p>
        </div>
        <div>
          <SectionLabel>content style</SectionLabel>
          <p className="mt-1 text-xs text-ink/60">{kol.content_style}</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-accent/8 border border-accent/15">
        <SectionLabel>engagement angle</SectionLabel>
        <p className="mt-1 text-xs text-ink/80 leading-relaxed">{kol.suggested_engagement_angle}</p>
      </div>

      {kol.outreach_dm && (
        <Collapsible title="outreach DM template">
          <div className="p-3 rounded-lg bg-surface-2 border border-white/8 relative group">
            <p className="text-xs text-ink/75 leading-relaxed whitespace-pre-wrap">{kol.outreach_dm}</p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={kol.outreach_dm} />
            </div>
          </div>
        </Collapsible>
      )}

      {kol.platforms?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {kol.platforms.map((p) => (
            <span key={p} className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-muted border border-white/6">{p}</span>
          ))}
        </div>
      )}
    </Card>
  );
}
