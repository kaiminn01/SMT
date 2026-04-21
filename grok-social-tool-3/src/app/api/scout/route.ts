/**
 * api/scout/route.ts
 * Replies tab — uses Grok with exact prompt format to find real tweets
 */

import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export interface ReplyAngle { text: string; tone: string; }

export interface ScoutedTweet {
  tweet_summary: string;
  tweet_url: string;
  google_search_url: string;
  author_handle: string;
  author_quality: string;
  reply_angles: ReplyAngle[];
}

export interface ScoutResponse {
  tweets: ScoutedTweet[];
  meta_context: string;
  keyword_used: string;
  timeframe_used: string;
}

export async function POST(req: NextRequest) {
  try {
    const { count, hours, keywords, tones } = await req.json() as {
      count: number;
      hours: number;
      keywords: string[];
      tones: string[];
    };

    if (!keywords?.length) {
      return NextResponse.json({ error: "keywords required" }, { status: 400 });
    }

    const toneStr = tones?.join(", ") ?? "non-shilly, conversational";
    const keywordLines = keywords.map(k => `- ${k}`).join("\n");
    const googleBase = keywords.map(k => encodeURIComponent(k)).join("+");

    const prompt = `You are a real-time X (Twitter) scout and reply generator.

Find ${count ?? 10} REAL tweets from the last ${hours ?? 6} hours related to:
${keywordLines}

Criteria:
- Must be REAL tweets found via X search
- Prioritize:
  - Verified accounts (blue tick)
  - OR accounts with strong credibility (founders, projects, known KOLs)
- Must have visible engagement (likes/replies/reposts)
- Avoid spam, bots, or low-quality accounts

For each tweet return:
- tweet_summary: 1-line summary of what the tweet is about
- tweet_url: direct URL to the tweet (https://twitter.com/username/status/ID or https://x.com/...)
- author_handle: @username
- author_quality: "verified" | "high-followers" | "known account"
- reply_angles: 2 reply suggestions in ${toneStr} tone — SHORT, natural, CT-style, not AI-sounding

Rules:
- DO NOT invent tweets
- DO NOT return example content
- ONLY return real tweet URLs found via X search
- Replies must be SHORT (under 200 chars), natural, add value

Return JSON:
{
  "meta_context": "2-3 sentences on what is driving conversation in this space right now",
  "keyword_used": "${keywords.join(", ")}",
  "timeframe_used": "last ${hours ?? 6} hours",
  "tweets": [
    {
      "tweet_summary": "1-line summary",
      "tweet_url": "https://twitter.com/username/status/...",
      "author_handle": "@username",
      "author_quality": "verified|high-followers|known account",
      "reply_angles": [
        {"text": "reply text under 200 chars", "tone": "${tones?.[0] ?? "conversational"}"},
        {"text": "reply text under 200 chars", "tone": "${tones?.[1] ?? "non-shilly"}"}
      ]
    }
  ]
}`;

    const result = await grokJSON<ScoutResponse>(prompt);

    // Add Google search URL to each tweet
    const enriched = {
      ...result,
      tweets: (result.tweets ?? []).map((t: ScoutedTweet) => ({
        ...t,
        google_search_url: `https://www.google.com/search?q=${encodeURIComponent(t.tweet_summary ?? keywords.join(" "))}`,
      })),
    };

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("[scout]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
