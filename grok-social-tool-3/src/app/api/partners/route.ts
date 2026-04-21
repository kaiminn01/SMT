/**
 * app/api/partners/route.ts
 * Partner Search — returns BD-ready partner profiles with outreach angles.
 */

import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export interface PartnerProfile {
  name: string;
  handle: string;
  category: string;
  why_relevant: string;
  integration_or_collab_angle: string;
  outreach_angle: string;
  priority_score: number;
  partnership_type: "integration" | "co-marketing" | "community" | "data" | "liquidity" | "distribution";
  status_hint: string;
}

export interface PartnersResponse {
  partners: PartnerProfile[];
  ecosystem_overview: string;
  outreach_framework: string[];
}

const SYSTEM_PROMPT = `You are a Web3 BD and ecosystem partnerships expert. Deep knowledge of DeFi, prediction markets, L1/L2 chains, data providers, AI platforms, launchpads, exchanges, and community projects. Your advice is practical and BD-ready. Return valid JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, ecosystem, category, client } = body as {
      niche?: string; ecosystem?: string; category?: string; client?: string;
    };

    const context = [niche, ecosystem, category].filter(Boolean).join(" / ");
    if (!context) return NextResponse.json({ error: "At least one of: niche, ecosystem, or category is required" }, { status: 400 });

    const clientCtx = client === "OmenX"
      ? "This is for OmenX, a leveraged outcome trading platform on Base/BNB Chain. Supports long/short outcome trading + fully collateralized no-liquidation markets. Looking for DEXes, oracles, data providers, wallets, launchpads, and community partners on Base and BNB Chain."
      : client === "SuperNet" ? "This is for SuperNet, an AI agent platform. Looking for AI tooling, compute providers, agent frameworks, and developer communities."
      : client === "SuperClaw" ? "This is for SuperClaw, a managed AI hosting product. Looking for cloud/infra partners, developer tools, and Web3 hosting ecosystems."
      : "";

    const userPrompt = `Find strategic partnership opportunities for: ${context}
${client ? `CLIENT CONTEXT: ${clientCtx}` : ""}

Generate 6-8 partner profiles. Mix of: high-priority strategic fits, mid-tier accessible, emerging/niche worth early engagement.

Return JSON:
{
  "ecosystem_overview": "2-3 sentence summary of the partnership landscape",
  "partners": [{
    "name": "Project Name",
    "handle": "@handle",
    "category": "DEX / Oracle / L2 / etc",
    "why_relevant": "specific reason this is a strong fit",
    "integration_or_collab_angle": "the actual integration or collab mechanic",
    "outreach_angle": "how to approach them, what to lead with",
    "priority_score": 8,
    "partnership_type": "integration"|"co-marketing"|"community"|"data"|"liquidity"|"distribution",
    "status_hint": "e.g. actively seeking integrations"
  }],
  "outreach_framework": ["step1","step2","step3","step4"]
}`;

    const result = await grokJSON<PartnersResponse>(SYSTEM_PROMPT, userPrompt, { temperature: 0.5, max_tokens: 2500 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
