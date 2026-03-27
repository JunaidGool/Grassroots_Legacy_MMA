import { NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import type { DashboardStats } from "@/types/api";

export async function GET() {
  try {
    const store = await getStore();
    const [fighters, matchups, scores, config] = await Promise.all([
      store.fighters.getAll(),
      store.matchups.getAll(),
      store.scores.getAll(),
      store.config.getAll(),
    ]);

    const stats: DashboardStats = {
      totalFighters: fighters.length,
      weighedIn: fighters.filter((f) => f.weighedIn).length,
      totalBouts: matchups.length,
      scored: scores.length,
    };

    return NextResponse.json({ success: true, data: { stats, config, matchups, fighters } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
