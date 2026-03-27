import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";
import { weighInSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = weighInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid weigh-in data" }, { status: 400 });
    }

    const store = await getStore();
    const fighter = await store.fighters.getById(parsed.data.fighterId);
    if (!fighter) {
      return NextResponse.json({ success: false, error: "Fighter not found" }, { status: 404 });
    }

    const updated = await store.fighters.update(parsed.data.fighterId, {
      weighedIn: true,
      weighInKg: parsed.data.weight,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to record weigh-in" }, { status: 500 });
  }
}
