"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ClientProvider, useClient, CLIENTS, type ClientId } from "@/lib/client-context";

const TrendsTab    = dynamic(() => import("@/components/TrendsTab"),   { ssr: false });
const RepliesTab   = dynamic(() => import("@/components/RepliesTab"),  { ssr: false });
const WriteTab     = dynamic(() => import("@/components/WriteTab"),    { ssr: false });
const AssistantTab = dynamic(() => import("@/components/AssistantTab"),{ ssr: false });

type TabId = "trends" | "replies" | "write" | "assistant";

const TABS = [
  { id: "trends" as TabId,    label: "Trends",     icon: "↯",  desc: "What's trending right now" },
  { id: "replies" as TabId,   label: "Replies",    icon: "↩",  desc: "Find real tweets + reply angles" },
  { id: "write" as TabId,     label: "Write",      icon: "✍",  desc: "Generate content in your voice" },
  { id: "assistant" as TabId, label: "Assistant",  icon: "◈",  desc: "Research + tool support + Notion agent" },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("trends");
  const { activeClient, setActiveClientId } = useClient();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-white/6 bg-surface-0/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
              <span className="text-accent text-xs font-mono font-bold">E</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-ink tracking-tight">Emerge Intel</h1>
              <p className="text-[10px] text-muted font-mono hidden sm:block">Claude + Grok · live intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {CLIENTS.map(client => (
              <button key={client.id} onClick={() => setActiveClientId(client.id as ClientId)}
                className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${activeClient.id === client.id ? client.color : "border-transparent text-muted hover:text-ink"}`}>
                {client.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-slow" />
            <span className="text-[10px] font-mono text-muted hidden sm:block">live</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0.5 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.desc}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink/70 hover:border-white/15"}`}>
                <span className={activeTab === tab.id ? "text-accent" : ""}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {activeTab === "trends"    && <TrendsTab />}
        {activeTab === "replies"   && <RepliesTab />}
        {activeTab === "write"     && <WriteTab />}
        {activeTab === "assistant" && <AssistantTab />}
      </main>

      <footer className="border-t border-white/4 py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted/40">emerge growth & marketing · internal</p>
          <p className="text-[10px] font-mono text-muted/40">claude + grok-3 · live web search</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <ClientProvider><AppShell /></ClientProvider>;
}
