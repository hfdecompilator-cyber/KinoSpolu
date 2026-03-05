import type { Party } from "../types";

export const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export function generatePartyCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function safeVideoUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return SAMPLE_VIDEO_URL;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

export function loadDemoParties(): Party[] {
  const raw = localStorage.getItem("demo_parties");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Party[];
  } catch {
    return [];
  }
}

export function saveDemoParties(parties: Party[]): void {
  localStorage.setItem("demo_parties", JSON.stringify(parties));
}
