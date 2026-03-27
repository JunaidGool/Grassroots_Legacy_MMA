import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchupId: string }> }
) {
  try {
    const { matchupId } = await params;
    const store = await getStore();
    const score = await store.scores.getByMatchupId(matchupId);
    if (!score) {
      return NextResponse.json({ success: false, error: "Score not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: score });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch score" }, { status: 500 });
  }
}
