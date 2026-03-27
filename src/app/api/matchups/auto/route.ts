import { NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";
import { autoMatchmake } from "@/lib/matchmaking";

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const store = await getStore();
    const fighters = await store.fighters.getAll();
    const matchups = await store.matchups.getAll();

    const proposed = autoMatchmake(fighters, matchups);

    const created = [];
    for (const m of proposed) {
      const matchup = await store.matchups.create(m);
      created.push(matchup);
    }

    return NextResponse.json({
      success: true,
      data: { count: created.length, matchups: created },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Auto-match failed" }, { status: 500 });
  }
}
