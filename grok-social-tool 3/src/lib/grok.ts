/**
 * lib/grok.ts
 * Grok API helper — used for Twitter/X intelligence only.
 * Uses xAI's OpenAI-compatible endpoint with live search enabled.
 */

const GROK_MODEL = process.env.GROK_MODEL ?? "grok-3";

function getHeaders() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not set");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
}

export async function grokSearch(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt },
  ];

  const body = {
    model: GROK_MODEL,
    messages,
    max_tokens: 3000,
    temperature: 0.4,
    response_format: { type: "json_object" },
    search_parameters: { mode: "on" }, // live X/web search
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Grok API error: ${(err as any).error?.message ?? res.statusText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function grokJSON<T = unknown>(prompt: string, systemPrompt?: string): Promise<T> {
  const raw = await grokSearch(prompt, systemPrompt);
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  }
}
