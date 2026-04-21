/**
 * components/ui.tsx
 * Shared atomic UI components used across all tabs.
 */
"use client";

import React, { useState } from "react";

// ── Copy Button ───────────────────────────────────────────────────────────────

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      console.error("Copy failed");
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all duration-200 focus-ring
        ${copied
          ? "bg-ok/20 text-ok border border-ok/30"
          : "bg-surface-3 text-muted hover:text-ink hover:bg-surface-4 border border-transparent hover:border-white/8"
        } ${className}`}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          copied
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          copy
        </>
      )}
    </button>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`shimmer rounded-md ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── Score Badge ───────────────────────────────────────────────────────────────

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "text-ok border-ok/30 bg-ok/10" :
    score >= 6 ? "text-electric border-electric/30 bg-electric/10" :
    "text-muted border-white/10 bg-surface-3";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${color}`}>
      <span className="opacity-60">#</span>{score}/10
    </span>
  );
}

// ── Risk / Tone Badge ─────────────────────────────────────────────────────────

const labelStyles: Record<string, string> = {
  safe:       "text-ok border-ok/30 bg-ok/10",
  balanced:   "text-electric border-electric/30 bg-electric/10",
  aggressive: "text-warn border-warn/30 bg-warn/10",
  high:       "text-ok border-ok/30 bg-ok/10",
  medium:     "text-electric border-electric/30 bg-electric/10",
  low:        "text-muted border-white/10 bg-surface-3",
  rising:     "text-ok border-ok/30 bg-ok/10",
  stable:     "text-electric border-electric/30 bg-electric/10",
  fading:     "text-muted border-white/10 bg-surface-3",
};

export function Badge({ label }: { label: string }) {
  const style = labelStyles[label] ?? "text-muted border-white/10 bg-surface-3";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono border ${style}`}>
      {label}
    </span>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-warn/8 border border-warn/20">
      <svg className="text-warn mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
      </svg>
      <p className="text-sm text-warn/90 font-mono">{message}</p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-3xl opacity-30">{icon ?? "◈"}</div>
      <p className="text-sm text-muted font-mono">{message}</p>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
      {children}
    </span>
  );
}

// ── Textarea input ────────────────────────────────────────────────────────────

export function Textarea({
  placeholder,
  value,
  onChange,
  rows = 4,
  className = "",
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-surface-2 border border-white/8 rounded-lg px-4 py-3 text-sm text-ink 
        placeholder:text-muted font-mono resize-none focus:outline-none focus:border-accent/50 
        focus:ring-1 focus:ring-accent/20 transition-all ${className}`}
    />
  );
}

// ── Text input ────────────────────────────────────────────────────────────────

export function Input({
  placeholder,
  value,
  onChange,
  className = "",
  onKeyDown,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className={`w-full bg-surface-2 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-ink 
        placeholder:text-muted font-mono focus:outline-none focus:border-accent/50 
        focus:ring-1 focus:ring-accent/20 transition-all ${className}`}
    />
  );
}

// ── Primary button ────────────────────────────────────────────────────────────

export function Button({
  children,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-200 focus-ring disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent hover:bg-accent-dim text-white shadow-accent-sm hover:shadow-accent",
    secondary: "bg-surface-3 hover:bg-surface-4 text-ink border border-white/8",
    ghost: "text-muted hover:text-ink hover:bg-surface-3",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-1 border border-white/6 rounded-xl shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider() {
  return <div className="border-t border-white/6 my-1" />;
}

// ── Collapsible section ───────────────────────────────────────────────────────

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <svg
          className={`transition-transform text-muted ${open ? "rotate-90" : ""}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-mono text-muted group-hover:text-ink transition-colors">{title}</span>
      </button>
      {open && <div className="mt-2 pl-4">{children}</div>}
    </div>
  );
}
