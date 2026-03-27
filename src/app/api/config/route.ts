import { NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";

export async function GET() {
  try {
    const store = await getStore();
    const config = await store.config.getAll();
    // Never expose PIN to client
    const { ADMIN_PIN: _, ...safeConfig } = config;
    return NextResponse.json({ success: true, data: safeConfig });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch config" }, { status: 500 });
  }
}
