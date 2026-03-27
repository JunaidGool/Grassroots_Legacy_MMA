import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const store = await getStore();
    await store.matchups.remove(id);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete matchup" }, { status: 500 });
  }
}
