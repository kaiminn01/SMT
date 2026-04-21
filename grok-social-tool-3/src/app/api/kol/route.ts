/**
 * app/api/kol/route.ts - Updated with Emerge tiering framework
 */

import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export type KOLCategory = "Legitimacy" | "Explainer" | "Conversion" | "Hype / Event";

export interface KOLProfile {
  handle: string;
  display_name: string;
  kol_category: KOLCategory;
  why_they_matter: string;
  audience_type: string;
  follower_range: string;
  content_style: string;
  priority_score: number;
  suggested_engagement_angle: string;
  collaboration_fit: "high" | "medium" | "low";
  platforms: string[];
  outreach_dm: string;
}

export interface KOLResponse {
  kols: KOLProfile[];
  niche_summary: string;
  outreach_tips: string[];
}

const SYSTEM_PROMPT = `You are a Web3 growth and partnerships expert who uses a functional KOL tiering system.

KOL CATEGORIES (use these exactly):
1. "Legitimacy" — establishes credibility and narrative. Respected voices in crypto, trading, prediction markets, Base, onchain finance.
2. "Explainer" — educates users. Writes threads, walkthroughs, demos, explains complex mechanics.
3. "Conversion" — drives signups and action. Local community operators with Telegram/Discord influence. SEA/KR audience takes action.
4. "Hype / Event" — creates momentum. Sports, meme, event, trend-driven. Great for match-day and event campaigns.

For each KOL, write a ready-to-use first-contact DM based on their category. Always return valid JSON only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, account_list, client } = body as {
      niche: string;
      account_list?: string;
      client?: string;
    };

    if (!niche?.trim() && !account_list?.trim()) {
      return NextResponse.json({ error: "niche or account_list is required" }, { status: 400 });
    }

    const clientContext = client === "OmenX"
      ? "OmenX is a leveraged outcome trading platform on Base/BNB Chain. Supports leveraged long/short and fully collateralized no-liquidation markets."
      : client === "SuperNet" ? "SuperNet is an AI agent platform and managed hosting product."
      : client === "SuperClaw" ? "SuperClaw is a managed AI hosting/infrastructure product."
      : "";

    const userPrompt = `Find KOLs for: NICHE: ${niche || "general crypto/Web3"}
${account_list ? `KNOWN ACCOUNTS: ${account_list}` : ""}
${client ? `CLIENT: ${client} — ${clientContext}` : ""}

Generate 6-8 KOLs spread across: 1-2 Legitimacy, 2 Explainer, 2 Conversion (prioritize SEA/local operators), 1-2 Hype/Event.

Return JSON:
{
  "niche_summary": "brief landscape description",
  "kols": [{
    "handle": "@username",
    "display_name": "Name",
    "kol_category": "Legitimacy"|"Explainer"|"Conversion"|"Hype / Event",
    "why_they_matter": "2-3 sentences",
    "audience_type": "description",
    "follower_range": "50k-200k",
    "content_style": "how they post",
    "priority_score": 8,
    "suggested_engagement_angle": "tactical advice",
    "collaboration_fit": "high"|"medium"|"low",
    "platforms": ["X","Telegram"],
    "outreach_dm": "Hey [Name], short personalized first-contact DM 3-5 sentences based on their category and style..."
  }],
  "outreach_tips": ["tip1","tip2","tip3"]
}`;

    const result = await grokJSON<KOLResponse>(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.5, max_tokens: 3000,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
