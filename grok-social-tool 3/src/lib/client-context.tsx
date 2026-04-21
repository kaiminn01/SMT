"use client";

/**
 * lib/client-context.tsx
 * Global client switcher state — OmenX / SuperNet / SuperClaw / General
 * Provides pre-loaded keywords and context per client.
 */

import React, { createContext, useContext, useState } from "react";

export type ClientId = "OmenX" | "SuperNet" | "SuperClaw" | "General";

export interface ClientConfig {
  id: ClientId;
  label: string;
  color: string;
  keywords: string[];
  niche: string;
  ecosystem: string;
}

export const CLIENTS: ClientConfig[] = [
  {
    id: "OmenX",
    label: "OmenX",
    color: "text-warn border-warn/30 bg-warn/10",
    keywords: ["prediction markets", "outcome trading", "Base", "leveraged trading", "event markets", "DeFi"],
    niche: "DeFi / prediction markets / outcome trading",
    ecosystem: "Base, BNB Chain",
  },
  {
    id: "SuperNet",
    label: "SuperNet",
    color: "text-electric border-electric/30 bg-electric/10",
    keywords: ["AI agents", "Web3 infra", "AI platform", "autonomous agents", "agent economy"],
    niche: "AI agents / Web3 infrastructure",
    ecosystem: "Multi-chain",
  },
  {
    id: "SuperClaw",
    label: "SuperClaw",
    color: "text-ok border-ok/30 bg-ok/10",
    keywords: ["managed hosting", "AI infrastructure", "cloud AI", "Web3 hosting"],
    niche: "Managed AI hosting / infrastructure",
    ecosystem: "Cloud / Web3",
  },
  {
    id: "General",
    label: "General",
    color: "text-muted border-white/10 bg-surface-3",
    keywords: ["crypto", "Web3", "DeFi", "AI", "trading"],
    niche: "General crypto / Web3",
    ecosystem: "Multi-chain",
  },
];

interface ClientContextType {
  activeClient: ClientConfig;
  setActiveClientId: (id: ClientId) => void;
}

const ClientContext = createContext<ClientContextType>({
  activeClient: CLIENTS[0],
  setActiveClientId: () => {},
});

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<ClientId>("OmenX");
  const activeClient = CLIENTS.find((c) => c.id === activeId) ?? CLIENTS[0];

  return (
    <ClientContext.Provider value={{ activeClient, setActiveClientId: setActiveId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
