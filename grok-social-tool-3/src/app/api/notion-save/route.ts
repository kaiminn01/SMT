import { NextRequest, NextResponse } from "next/server";
import { saveToPostsLog } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveToPostsLog(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
