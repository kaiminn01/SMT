/**
 * lib/claude.ts
 * Claude API helper with GPT-4o fallback.
 * Uses Anthropic SDK for Claude, falls back to OpenAI SDK if Claude is down.
 */

const CLAUDE_MODEL = "claude-opus-4-5";
const GPT_MODEL = "gpt-4o";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callClaude(messages: Message[], maxTokens = 3000, json = false): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const system = messages.find(m => m.role === "system")?.content ?? "";
  const conversation = messages.filter(m => m.role !== "system");

  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: conversation,
    system,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "interleaved-thinking-2025-05-14",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API error: ${(err as any).error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data.content?.find((b: any) => b.type === "text")?.text ?? "";
}

async function callGPT(messages: Message[], maxTokens = 3000, json = false): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const body: Record<string, unknown> = {
    model: GPT_MODEL,
    max_tokens: maxTokens,
    messages,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${(err as any).error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Main call function — tries Claude first, falls back to GPT-4o
 */
export async function claudeChat(
  messages: Message[],
  options: { maxTokens?: number; json?: boolean } = {}
): Promise<string> {
  const { maxTokens = 3000, json = false } = options;

  try {
    return await callClaude(messages, maxTokens, json);
  } catch (err) {
    console.warn("[claude] primary failed, trying GPT-4o fallback:", err);
    try {
      return await callGPT(messages, maxTokens, json);
    } catch (fallbackErr) {
      throw new Error(`Both Claude and GPT-4o failed. Last error: ${fallbackErr}`);
    }
  }
}

export async function claudeAsk(
  system: string,
  user: string,
  options: { maxTokens?: number; json?: boolean } = {}
): Promise<string> {
  return claudeChat(
    [{ role: "system", content: system }, { role: "user", content: user }],
    options
  );
}

export async function claudeJSON<T = unknown>(
  system: string,
  user: string,
  options: { maxTokens?: number } = {}
): Promise<T> {
  const raw = await claudeAsk(system, user, { ...options, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
