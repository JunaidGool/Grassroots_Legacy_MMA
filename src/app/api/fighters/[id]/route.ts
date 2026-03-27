import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { isAuthenticated } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = await getStore();
    const fighter = await store.fighters.getById(id);
    if (!fighter) {
      return NextResponse.json({ success: false, error: "Fighter not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: fighter });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch fighter" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const store = await getStore();
    const fighter = await store.fighters.update(id, body);
    return NextResponse.json({ success: true, data: fighter });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update fighter" }, { status: 500 });
  }
}

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
    await store.fighters.remove(id);
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete fighter" }, { status: 500 });
  }
}
