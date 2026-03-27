import { NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { computeRankings } from "@/lib/rankings";

export async function GET() {
  try {
    const store = await getStore();
    const [fighters, matchups, scores] = await Promise.all([
      store.fighters.getAll(),
      store.matchups.getAll(),
      store.scores.getAll(),
    ]);

    const rankings = computeRankings(fighters, matchups, scores);
    return NextResponse.json({ success: true, data: rankings });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to compute rankings" }, { status: 500 });
  }
}
