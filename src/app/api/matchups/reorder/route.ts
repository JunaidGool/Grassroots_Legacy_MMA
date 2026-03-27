import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderedIds } = await req.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ success: false, error: "orderedIds must be an array" }, { status: 400 });
    }

    const store = await getStore();
    await store.matchups.reorder(orderedIds);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reorder" }, { status: 500 });
  }
}
