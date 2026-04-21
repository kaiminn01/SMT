/**
 * lib/notion.ts
 * Notion API helper — reads Content OS pages + saves to Posts Log
 */

const NOTION_VERSION = "2022-06-28";
const POSTS_LOG_DB = "34181147-cbf2-8081-b0bf-000b8bc15505";

// Content OS page IDs
const CONTENT_OS_PAGES = {
  brandVoice: "34181147-cbf2-80d1-957e-d465ebef8123",
  hooks:      "34181147-cbf2-80ed-a936-ff13e4470863",
  contentTypes: "34181147-cbf2-812a-ae28-f3300efb641f",
  index:      "34181147-cbf2-80c8-aae0-fbe327d873de",
};

function headers() {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new Error("NOTION_API_KEY not set");
  return {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

async function fetchPage(id: string): Promise<string> {
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Notion fetch failed: ${res.statusText}`);
  const data = await res.json();

  // Extract plain text from blocks
  const texts: string[] = [];
  for (const block of data.results ?? []) {
    const type = block.type;
    const content = block[type];
    if (!content) continue;

    if (content.rich_text) {
      const text = content.rich_text.map((t: any) => t.plain_text).join("");
      if (text.trim()) texts.push(text);
    }
    if (content.title) {
      const text = content.title.map((t: any) => t.plain_text).join("");
      if (text.trim()) texts.push(`# ${text}`);
    }
  }
  return texts.join("\n");
}

/**
 * Reads all Content OS pages and returns combined context string
 */
export async function readContentOS(): Promise<string> {
  try {
    const [brandVoice, hooks, contentTypes, index] = await Promise.all([
      fetchPage(CONTENT_OS_PAGES.brandVoice),
      fetchPage(CONTENT_OS_PAGES.hooks),
      fetchPage(CONTENT_OS_PAGES.contentTypes),
      fetchPage(CONTENT_OS_PAGES.index),
    ]);

    return `
=== BRAND VOICE ===
${brandVoice}

=== HOOK FORMULAS ===
${hooks}

=== CONTENT TYPES ===
${contentTypes}

=== CONTENT OS INDEX ===
${index}
    `.trim();
  } catch (err) {
    console.error("[notion] readContentOS failed:", err);
    return ""; // graceful fallback — tool still works without Notion
  }
}

export interface PostLogEntry {
  title: string;
  content: string;
  platform: string;
  hookType?: string;
  topic?: string;
  client?: string;
  audience?: string;
}

/**
 * Saves a post draft to the Notion Posts Log database
 */
export async function saveToPostsLog(entry: PostLogEntry): Promise<{ url: string; id: string }> {
  const properties: Record<string, unknown> = {
    "Post Title": { title: [{ text: { content: entry.title } }] },
    "Post Content": { rich_text: [{ text: { content: entry.content.slice(0, 2000) } }] },
    "Platform": { multi_select: [{ name: entry.platform }] },
    "Status": { select: { name: "🟡 Draft — Pending Approval" } },
    "Source": { select: { name: "Emerge Intel" } },
    "Publish Date": { date: { start: new Date().toISOString().split("T")[0] } },
  };

  if (entry.hookType) properties["Hook Type"] = { select: { name: entry.hookType } };
  if (entry.topic)    properties["Topic"]     = { rich_text: [{ text: { content: entry.topic } }] };
  if (entry.client)   properties["Client"]    = { select: { name: entry.client } };
  if (entry.audience) properties["Audience"]  = { rich_text: [{ text: { content: entry.audience } }] };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      parent: { database_id: POSTS_LOG_DB },
      properties,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? "Notion save failed");
  }

  const page = await res.json();
  return { url: page.url, id: page.id };
}

/**
 * Updates a Notion page (for assistant Notion agent mode)
 */
export async function updateNotionPage(pageId: string, content: string): Promise<void> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      properties: {},
    }),
  });
  if (!res.ok) throw new Error(`Notion update failed: ${res.statusText}`);
}

/**
 * Reads Posts Log entries for reporting
 */
export async function readPostsLog(): Promise<any[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${POSTS_LOG_DB}/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      sorts: [{ property: "Publish Date", direction: "descending" }],
      page_size: 50,
    }),
  });
  if (!res.ok) throw new Error(`Notion query failed: ${res.statusText}`);
  const data = await res.json();
  return data.results ?? [];
}
