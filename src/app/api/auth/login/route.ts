import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/sheets";
import { createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "PIN is required" }, { status: 400 });
    }

    const store = await getStore();
    const storedPin = await store.config.get("ADMIN_PIN");

    if (parsed.data.pin !== storedPin) {
      return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 });
    }

    const token = await createSession();
    await setSessionCookie(token);

    return NextResponse.json({ success: true, data: { authenticated: true } });
  } catch {
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
