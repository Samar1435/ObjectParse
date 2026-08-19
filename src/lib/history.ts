import type { JwtAlgorithm } from "@/lib/jwt";

export type ToolSlug = "base64" | "json" | "jwt";

export type HistoryPayload =
  | { tool: "base64"; mode: "encode"; text: string; urlSafe: boolean }
  | { tool: "base64"; mode: "decode"; input: string }
  | { tool: "json"; content: string }
  | { tool: "jwt"; mode: "decode"; token: string }
  | { tool: "jwt"; mode: "encode"; alg: JwtAlgorithm; headerJson: string; payloadJson: string };

export interface HistoryEntry {
  id: string;
  tool: ToolSlug;
  label: string;
  preview: string;
  createdAt: number;
  payload: HistoryPayload;
}

export const MAX_HISTORY_ENTRIES = 60;
export const MAX_PAYLOAD_LENGTH = 20_000;
export const HISTORY_RETENTION_DAYS = 3;

export function truncate(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

export function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function dayLabel(timestamp: number, now: number): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
