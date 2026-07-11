import { NextRequest, NextResponse } from "next/server";
import { saveState, type McpState } from "@/lib/mcp-state";

export async function POST(req: NextRequest) {
  try {
    const body: McpState = await req.json();
    saveState(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
