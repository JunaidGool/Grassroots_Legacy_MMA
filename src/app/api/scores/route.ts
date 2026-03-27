import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";
import { createScoreSchema } from "@/lib/validators";

export async function GET() {
  try {
    const store = await getStore();
    const scores = await store.scores.getAll();
    return NextResponse.json({ success: true, data: scores });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch scores" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createScoreSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const store = await getStore();
    const existing = await store.scores.getByMatchupId(parsed.data.matchupId);

    let score;
    if (existing) {
      score = await store.scores.update(parsed.data.matchupId, parsed.data);
    } else {
      score = await store.scores.create(parsed.data);
    }

    return NextResponse.json({ success: true, data: score }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to submit score" }, { status: 500 });
  }
}
