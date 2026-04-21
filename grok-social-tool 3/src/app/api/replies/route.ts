/**
 * app/api/replies/route.ts
 * Reply Generator: takes tweet text, returns 5 suggested replies with tone labels.
 */

import { NextRequest, NextResponse } from "next/server";
import { grokJSON } from "@/lib/grok";

export type ToneOption = "casual" | "crypto-native" | "non-shilly" | "witty";
export type RiskLabel = "safe" | "balanced" | "aggressive";

export interface SuggestedReply {
  text: string;
  label: RiskLabel;
  tone: ToneOption;
  character_count: number;
  why_it_works: string;
}

export interface RepliesResponse {
  replies: SuggestedReply[];
  original_tweet_summary: string;
  context_read: string;
}

const SYSTEM_PROMPT = `You are a crypto-native social media operator who writes authentic, high-engagement replies for X/Twitter.

You understand Web3 culture deeply — prediction markets, DeFi, AI agents, builder communities, SEA crypto scene.
You write replies that feel human, not corporate. You avoid shilling. You add value or signal.
You understand what drives engagement without being cringe.

Tone definitions:
- "casual": conversational, lowercase preferred, feels like a reply from a smart friend
- "crypto-native": uses ecosystem vocabulary naturally, speaks to insiders
- "non-shilly": deliberately avoids hype, sounds credible and grounded
- "witty": sharp, clever angle, may use light humor or subversion

Always return valid JSON. No markdown. No extra text.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tweet_text, tones } = body as {
      tweet_text: string;
      tones?: ToneOption[];
    };

    if (!tweet_text?.trim()) {
      return NextResponse.json(
        { error: "tweet_text is required" },
        { status: 400 }
      );
    }

    const selectedTones = tones ?? [
      "casual",
      "crypto-native",
      "non-shilly",
      "witty",
    ];
    const tonesStr = selectedTones.join(", ");

    const userPrompt = `
Generate 5 reply suggestions for this tweet/post:

TWEET:
"${tweet_text.trim()}"

Requirements:
- Cover a range of risk labels: safe (agree/add value), balanced (add nuance), aggressive (push back or challenge)
- Use these tones across the 5 replies: ${tonesStr}
- Each reply should be under 280 characters
- Replies must feel genuine, not bot-like
- At least 1 reply should add a data point or specific reference to boost credibility
- At least 1 reply should ask an engaging question

Return JSON:
{
  "original_tweet_summary": "one sentence summary of what the tweet is about",
  "context_read": "brief note on the narrative context or angle being taken in the tweet",
  "replies": [
    {
      "text": "the actual reply text",
      "label": "safe" | "balanced" | "aggressive",
      "tone": "casual" | "crypto-native" | "non-shilly" | "witty",
      "character_count": 150,
      "why_it_works": "one sentence on why this reply is effective"
    }
  ]
}
`;

    const result = await grokJSON<RepliesResponse>(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.8, // higher temp for creative variety
      max_tokens: 2000,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[replies] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
