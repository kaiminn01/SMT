"use client";

/**
 * lib/use-notion-save.ts
 * Hook for saving a KOL or Partner card to Notion.
 * Tracks per-handle save state so buttons show feedback immediately.
 */

import { useState, useCallback } from "react";
import type { NotionSavePayload } from "@/app/api/notion-save/route";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useNotionSave() {
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});

  const saveToNotion = useCallback(async (payload: NotionSavePayload) => {
    const key = payload.handle;
    setStatuses((prev) => ({ ...prev, [key]: "saving" }));

    try {
      const res = await fetch("/api/notion-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setStatuses((prev) => ({ ...prev, [key]: "saved" }));
      // Reset after 4 seconds so button can be clicked again if needed
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [key]: "idle" }));
      }, 4000);
    } catch (err) {
      console.error("[notion-save]", err);
      setStatuses((prev) => ({ ...prev, [key]: "error" }));
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [key]: "idle" }));
      }, 3000);
    }
  }, []);

  const getStatus = useCallback((handle: string): SaveStatus => {
    return statuses[handle] ?? "idle";
  }, [statuses]);

  return { saveToNotion, getStatus };
}
