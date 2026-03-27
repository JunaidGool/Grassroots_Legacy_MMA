import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";
import { createMatchupSchema } from "@/lib/validators";

export async function GET() {
  try {
    const store = await getStore();
    const matchups = await store.matchups.getAll();
    return NextResponse.json({ success: true, data: matchups });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch matchups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createMatchupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const store = await getStore();
    const matchup = await store.matchups.create(parsed.data);
    return NextResponse.json({ success: true, data: matchup }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create matchup" }, { status: 500 });
  }
}
