"use client";

/**
 * components/NotionSaveButton.tsx
 * Reusable "Save to Notion" button with loading / saved / error states.
 */

import React from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NotionSaveButtonProps {
  status: SaveStatus;
  onClick: () => void;
  className?: string;
}

export default function NotionSaveButton({ status, onClick, className = "" }: NotionSaveButtonProps) {
  const configs = {
    idle: {
      label: "Save to Notion",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 4l2 2.5L8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
      cls: "bg-surface-3 text-muted border-white/8 hover:text-ink hover:border-white/15",
    },
    saving: {
      label: "Saving...",
      icon: (
        <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="16" strokeDashoffset="8" />
        </svg>
      ),
      cls: "bg-surface-3 text-muted border-white/8 opacity-70 cursor-wait",
    },
    saved: {
      label: "Saved ✓",
      icon: null,
      cls: "bg-ok/15 text-ok border-ok/30",
    },
    error: {
      label: "Error — retry?",
      icon: null,
      cls: "bg-warn/15 text-warn border-warn/30",
    },
  };

  const cfg = configs[status];

  return (
    <button
      onClick={onClick}
      disabled={status === "saving" || status === "saved"}
      title="Save to Notion KOL & Partner Tracker"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all duration-200 disabled:cursor-not-allowed ${cfg.cls} ${className}`}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}
