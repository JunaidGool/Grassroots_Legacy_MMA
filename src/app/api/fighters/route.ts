import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";
import { createFighterSchema } from "@/lib/validators";
import { detectWeightClass } from "@/lib/weight-classes";
import type { ApiResponse } from "@/types/api";
import type { Fighter } from "@/types/fighter";

export async function GET() {
  try {
    const store = await getStore();
    const fighters = await store.fighters.getAll();
    return NextResponse.json({ success: true, data: fighters } satisfies ApiResponse<Fighter[]>);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch fighters" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createFighterSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    // Verify weight class server-side
    const wc = detectWeightClass(parsed.data.gender, parsed.data.ageCat, parsed.data.weight);
    if (!wc) {
      return NextResponse.json(
        { success: false, error: "Weight is out of range for this division" },
        { status: 400 }
      );
    }

    const store = await getStore();

    // Check for duplicate (same name + gender + age category)
    const existing = await store.fighters.getAll();
    const duplicate = existing.find(
      (f) =>
        f.name.toLowerCase() === parsed.data.name.toLowerCase() &&
        f.gender === parsed.data.gender &&
        f.ageCat === parsed.data.ageCat
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: `${parsed.data.name} is already registered in ${parsed.data.ageCat} (${parsed.data.gender})` },
        { status: 409 }
      );
    }

    const fighter = await store.fighters.create({ ...parsed.data, weightClass: wc });

    return NextResponse.json({ success: true, data: fighter } satisfies ApiResponse<Fighter>, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create fighter" }, { status: 500 });
  }
}
