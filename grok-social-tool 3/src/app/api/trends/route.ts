/**
 * api/trends/route.ts
 * Step 1: Claude searches live web for real trending topics + article URLs
 * Step 2: Grok validates each topic on X — verified/credible accounts only
 */

import { NextRequest, NextResponse } from "next/server";
import { claudeJSON } from "@/lib/claude";
import { grokJSON } from "@/lib/grok";

export interface WebLink { title: string; url: string; }
export interface TwitterLink { handle: string; url: string; credibility: string; }

export interface TrendTopic {
  topic: string;
  category: string;
  momentum: "High" | "Medium" | "Low";
  why_it_matters: string;
  what_people_are_saying: string;
  reply_angles: string[];
  draft_tweets: string[];
  web_links: WebLink[];
  twitter_links: TwitterLink[] | "No reliable X discussion found";
}

export interface TrendsResponse {
  topics: TrendTopic[];
  meta_summary: string;
  generated_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const { keywords, client, mode, timeframe } = await req.json() as {
      keywords?: string[];
      client?: string;
      mode?: "general" | "keyword";
      timeframe?: string;
    };

    const isGeneral = mode === "general" || !keywords?.length;
    const timeStr = timeframe ?? "last 24h";
    const clientCtx = client === "OmenX"
      ? "Also flag anything relevant to: prediction markets, outcome trading, Base chain, leveraged trading, DeFi, sports betting."
      : client === "SuperNet" ? "Flag anything relevant to: AI agents, autonomous agents, Web3 infra."
      : client === "SuperClaw" ? "Flag anything relevant to: AI hosting, managed infra, cloud AI."
      : "";

    // STEP 1 — Claude web research
    const claudeSystem = `You are a real-time research agent for crypto/X (Twitter) operators.
Find REAL trending topics from the web with REAL article URLs. No fake links. No placeholders.
If no valid source found for a topic, return null for web_links.
Return valid JSON only.`;

    const claudePrompt = isGeneral
      ? `Search the web right now. Find 4-5 REAL trending topics from the ${timeStr}.
${clientCtx}

For each topic find at least 1 real news article or source URL.

Return JSON:
{
  "topics": [{
    "topic": "specific topic name",
    "category": "macro|crypto|regulation|AI|politics|markets|sports",
    "momentum": "High|Medium|Low",
    "why_it_matters": "2-3 sentences — what specifically is happening right now",
    "what_people_are_saying": "main takes and debate angles",
    "reply_angles": ["angle1","angle2","angle3"],
    "draft_tweets": ["tweet under 280c lowercase no hashtags","tweet under 280c"],
    "web_links": [{"title":"Article title","url":"https://real-url.com"}]
  }],
  "meta_summary": "1-2 sentence overview of today's narrative"
}`
      : `Search the web right now. Find what is ACTUALLY trending in the ${timeStr} related to: ${keywords!.join(", ")}
${clientCtx}

For each topic find at least 1 real news article or source URL.

Return JSON:
{
  "topics": [{
    "topic": "specific topic name",
    "category": "macro|crypto|regulation|AI|politics|markets|sports",
    "momentum": "High|Medium|Low",
    "why_it_matters": "2-3 sentences on what is happening right now",
    "what_people_are_saying": "main takes circulating",
    "reply_angles": ["angle1","angle2","angle3"],
    "draft_tweets": ["tweet under 280c lowercase no hashtags","tweet under 280c","tweet under 280c"],
    "web_links": [{"title":"Article title","url":"https://real-url.com"}]
  }],
  "meta_summary": "overview of what is driving conversation"
}`;

    const claudeResult = await claudeJSON<{ topics: Omit<TrendTopic, "twitter_links">[]; meta_summary: string }>(
      claudeSystem, claudePrompt, { maxTokens: 3000 }
    );

    // STEP 2 — Grok X validation for each topic
    const topicsWithX = await Promise.all(
      (claudeResult.topics ?? []).map(async (topic) => {
        try {
          const grokPrompt = `Search X (Twitter) right now for: "${topic.topic}"

Find 1-2 tweets about this topic from:
- Verified accounts (blue tick) OR
- Accounts with 50k+ followers OR
- Official org/project/founder accounts

For each tweet found return the tweet URL and author info.
If none found matching these criteria, return null.

Return JSON:
{
  "found": true|false,
  "tweets": [
    {
      "handle": "@username",
      "url": "https://twitter.com/username/status/ID",
      "credibility": "verified|high-followers|known-org"
    }
  ]
}`;

          const xResult = await grokJSON<{ found: boolean; tweets: TwitterLink[] }>(grokPrompt);
          return {
            ...topic,
            twitter_links: xResult.found && xResult.tweets?.length > 0
              ? xResult.tweets
              : "No reliable X discussion found" as const,
          };
        } catch {
          return { ...topic, twitter_links: "No reliable X discussion found" as const };
        }
      })
    );

    const result: TrendsResponse = {
      topics: topicsWithX,
      meta_summary: claudeResult.meta_summary ?? "",
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[trends]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
