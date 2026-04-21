import { NextRequest, NextResponse } from "next/server";
import { claudeAsk, claudeJSON } from "@/lib/claude";
import { readContentOS } from "@/lib/notion";

export interface ContentAngle {
  id: string;
  hook_type: "Contrarian" | "Proof" | "Insider" | "Replacement" | "Discovery";
  angle: string;
  why_it_works: string;
  supporting_reference: string;
  platform_format: string;
  audience: string;
}

export interface WriteAnglesResponse {
  angles: ContentAngle[];
  research_context: string;
}

export interface WritePostResponse {
  post: string;
  hook_type: string;
  platform: string;
  word_count: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, platform, audience, angle, client, refineMode } = body;

    const contentOS = await readContentOS();
    const clientCtx = client === "OmenX"
      ? "Client: OmenX — leveraged prediction/outcome trading on Base and BNB Chain. Long/short outcome trading + fully collateralized no-liquidation markets."
      : client === "SuperNet" ? "Client: SuperNet — AI agent platform and managed hosting."
      : client === "SuperClaw" ? "Client: SuperClaw — managed AI hosting/infrastructure."
      : "";

    if (action === "angles") {
      const system = `You are a senior crypto/Web3 content strategist. You write for insider audiences — crypto traders, DeFi users, Web3 builders. You have the user's Content OS rules. Search the web for current context. Return valid JSON only.`;

      const userPrompt = `${contentOS ? `CONTENT OS RULES:\n${contentOS}\n\n` : ""}${clientCtx ? `CLIENT: ${clientCtx}\n\n` : ""}
Generate up to 5 content angles for:
Topic: ${topic || "auto — what is most relevant right now for " + (client ?? "crypto/Web3")}
Platform: ${platform ?? "X"}
Audience: ${(audience ?? []).join(", ") || "Traders, Builders"}

Search web for CURRENT context (last 24-72h). Extract real facts, live narratives, real examples.

Rules:
- Each angle must have a clear opinion or insight — NOT generic
- Grounded in real-world reference
- Use hook formulas from Content OS
- If no strong angle exists return fewer results — never return weak ones

Return JSON:
{
  "research_context": "2-3 sentences from web research",
  "angles": [{
    "id": "1",
    "hook_type": "Contrarian|Proof|Insider|Replacement|Discovery",
    "angle": "specific non-generic angle with clear stance",
    "why_it_works": "1 line why this performs",
    "supporting_reference": "real event/data/behavior",
    "platform_format": "Short Take|Thread|Long-form Tweet|Carousel|Newsletter",
    "audience": "Traders|Builders|etc"
  }]
}`;

      const result = await claudeJSON<WriteAnglesResponse>(system, userPrompt, { maxTokens: 3000 });
      return NextResponse.json(result);
    }

    if (action === "write" || action === "refine") {
      if (!angle) return NextResponse.json({ error: "angle is required" }, { status: 400 });

      const refineInstr = refineMode === "sharper" ? "Make it tighter and more punchy. Cut any fat. Every word must earn its place."
        : refineMode === "degen" ? "Make it more crypto-native and edgy. Use insider vocabulary. Dial up the confidence."
        : refineMode === "beginner" ? "Make it simpler and more accessible. Use plain language. Still sharp, but anyone can understand it."
        : "";

      const system = `You are a crypto/Web3 copywriter for an insider audience. Follow Content OS rules exactly. Write like a real operator — not a marketer, not an AI. Return only the post text.`;

      const userPrompt = `${contentOS ? `CONTENT OS RULES:\n${contentOS}\n\n` : ""}${clientCtx ? `CLIENT: ${clientCtx}\n\n` : ""}
Write a ${platform ?? "X"} post:
Hook type: ${angle.hook_type}
Angle: ${angle.angle}
Reference: ${angle.supporting_reference}
Audience: ${angle.audience}
Format: ${angle.platform_format}
${refineInstr ? `\nREFINEMENT: ${refineInstr}` : ""}

STRICT RULES:
- lowercase only
- no hashtags (X)
- no corporate tone
- no "in today's world", "let's dive in", "this is important"
- short lines, spaced out
- every line carries meaning
- specific details — numbers, behaviors, real examples
- at least one real-world reference
- sounds like an insider not a marketer

${platform === "X" ? "Format: bold claim → context → insight/punchline. Under 280c for short take. Thread: hook + 4-8 numbered tweets." : ""}
${platform === "LinkedIn" ? "Format: story open → 3-5 insight paragraphs → one CTA." : ""}
${platform === "Instagram" ? "Format: hook first line → short punchy paragraphs → carousel outline if needed." : ""}
${platform === "Discord" ? "Format: direct, community-first, actionable." : ""}
${platform === "Newsletter" ? "Format: story open → insight breakdown → one strong CTA." : ""}

Return ONLY the post text.`;

      const post = await claudeAsk(system, userPrompt, { maxTokens: 2000 });
      return NextResponse.json({ post: post.trim(), hook_type: angle.hook_type, platform: platform ?? "X", word_count: post.trim().split(/\s+/).length });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[write]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
