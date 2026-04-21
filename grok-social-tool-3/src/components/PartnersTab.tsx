"use client";

import React, { useState } from "react";
import {
  Button, Card, CopyButton, Badge, ScoreBadge,
  SkeletonCard, ErrorBox, EmptyState, SectionLabel, Input
} from "@/components/ui";
import NotionSaveButton from "@/components/NotionSaveButton";
import { useNotionSave } from "@/lib/use-notion-save";
import { useClient } from "@/lib/client-context";
import type { PartnerProfile, PartnersResponse } from "@/app/api/partners/route";

const QUICK_CATEGORIES = ["DeFi / DEX","prediction markets","Base ecosystem","data / oracles","AI + crypto","wallets / infra","launchpads","SEA Web3"];
const PARTNERSHIP_TYPE_STYLES: Record<string, string> = {
  integration:    "text-electric border-electric/30 bg-electric/10",
  "co-marketing": "text-ok border-ok/30 bg-ok/10",
  community:      "text-accent border-accent/30 bg-accent/10",
  data:           "text-warn border-warn/30 bg-warn/10",
  liquidity:      "text-ok border-ok/30 bg-ok/10",
  distribution:   "text-electric border-electric/30 bg-electric/10",
};

export default function PartnersTab() {
  const { activeClient } = useClient();
  const { saveToNotion, getStatus } = useNotionSave();
  const [niche, setNiche] = useState("");
  const [ecosystem, setEcosystem] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PartnersResponse | null>(null);

  const handleSearch = async () => {
    const searchNiche = niche.trim() || activeClient.niche;
    const searchEco = ecosystem.trim() || activeClient.ecosystem;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: searchNiche, ecosystem: searchEco, category, client: activeClient.id }),
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
          <SectionLabel>quick category</SectionLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c === category ? "" : c)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all
                  ${category === c ? "bg-accent/20 border-accent/40 text-accent" : "bg-surface-2 border-white/8 text-muted hover:text-ink"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <SectionLabel>niche</SectionLabel>
            <Input placeholder={activeClient.niche} value={niche} onChange={setNiche} className="mt-1.5" />
          </div>
          <div>
            <SectionLabel>ecosystem / chain</SectionLabel>
            <Input placeholder={activeClient.ecosystem} value={ecosystem} onChange={setEcosystem} className="mt-1.5" />
          </div>
          <div>
            <SectionLabel>category / type</SectionLabel>
            <Input placeholder="e.g. DEX, data provider" value={category} onChange={setCategory} className="mt-1.5" />
          </div>
        </div>
        <Button onClick={handleSearch} loading={loading}>
          {loading ? "Searching..." : "↯ Find Partners"}
        </Button>
      </Card>

      {error && <ErrorBox message={error} />}
      {loading && <div className="space-y-3">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>}

      {result && !loading && (
        <div className="space-y-4 animate-in">
          <div className="p-4 rounded-lg bg-accent/8 border border-accent/20">
            <SectionLabel>ecosystem read</SectionLabel>
            <p className="mt-1 text-sm text-ink/80 leading-relaxed">{result.ecosystem_overview}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.partners.map((p, i) => (
              <PartnerCard key={i} partner={p} client={activeClient.id}
                saveStatus={getStatus(p.handle)}
                onSave={() => saveToNotion({
                  type: "Partner",
                  name: p.name,
                  handle: p.handle,
                  niche: niche || activeClient.niche,
                  client: activeClient.id,
                  partnership_type: p.partnership_type,
                  priority_score: p.priority_score,
                  collaboration_fit: p.priority_score >= 8 ? "high" : p.priority_score >= 6 ? "medium" : "low",
                  outreach_angle: p.outreach_angle,
                  why_they_matter: p.why_relevant,
                })}
              />
            ))}
          </div>
          {result.outreach_framework?.length > 0 && (
            <Card className="p-5">
              <SectionLabel>outreach framework</SectionLabel>
              <ol className="mt-3 space-y-2">
                {result.outreach_framework.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent font-mono text-xs mt-0.5 shrink-0 w-4">{i+1}.</span>
                    <span className="text-sm text-ink/75">{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}
      {!loading && !result && !error && <EmptyState icon="◬" message="enter a niche or ecosystem to find partner opportunities" />}
    </div>
  );
}

function PartnerCard({ partner, client, saveStatus, onSave }: {
  partner: PartnerProfile;
  client: string;
  saveStatus: "idle"|"saving"|"saved"|"error";
  onSave: () => void;
}) {
  const cleanHandle = partner.handle.replace(/^@/, "");
  const twitterUrl = `https://twitter.com/${cleanHandle}`;
  const typeStyle = PARTNERSHIP_TYPE_STYLES[partner.partnership_type] ?? "text-muted border-white/10 bg-surface-3";

  const copyText = [
    `${partner.name} ${partner.handle}`,
    `Category: ${partner.category}`,
    `Why: ${partner.why_relevant}`,
    `Collab: ${partner.integration_or_collab_angle}`,
    `Outreach: ${partner.outreach_angle}`,
  ].join("\n");

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink">{partner.name}</span>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono text-accent hover:text-electric transition-colors inline-flex items-center gap-1 group">
              {partner.handle}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="opacity-40 group-hover:opacity-100">
                <path d="M1.5 7.5l6-6M4 1.5h4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${typeStyle}`}>
              {partner.partnership_type}
            </span>
            <ScoreBadge score={partner.priority_score} />
            <span className="text-xs font-mono text-muted">{partner.category}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <CopyButton text={copyText} />
          <NotionSaveButton status={saveStatus} onClick={onSave} />
        </div>
      </div>
      <p className="text-xs text-ink/70 leading-relaxed">{partner.why_relevant}</p>
      <div>
        <SectionLabel>collab / integration angle</SectionLabel>
        <p className="mt-1 text-xs text-ink/60 leading-relaxed">{partner.integration_or_collab_angle}</p>
      </div>
      <div className="p-3 rounded-lg bg-ok/8 border border-ok/15">
        <SectionLabel>outreach angle</SectionLabel>
        <p className="mt-1 text-xs text-ink/80 leading-relaxed">{partner.outreach_angle}</p>
      </div>
      {partner.status_hint && <p className="text-xs text-muted italic">◎ {partner.status_hint}</p>}
    </Card>
  );
}
