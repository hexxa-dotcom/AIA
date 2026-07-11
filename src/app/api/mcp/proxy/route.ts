import { NextRequest, NextResponse } from "next/server";

// Proxy JSON-RPC requests to external MCP servers (avoids CORS)
export async function POST(req: NextRequest) {
  const { serverUrl, method, params, id = 1 } = await req.json();

  if (!serverUrl || !method) {
    return NextResponse.json({ error: "serverUrl and method required" }, { status: 400 });
  }

  try {
    const res = await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params: params ?? {}, id }),
    });

    const text = await res.text();

    // Handle SSE response — extract the first data: line with a result
    if (text.includes("data:")) {
      const lines = text.split("\n").filter((l) => l.startsWith("data:"));
      for (const line of lines) {
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.result !== undefined || json.error !== undefined) {
            return NextResponse.json(json);
          }
        } catch {}
      }
      return NextResponse.json({ error: "No result in SSE stream" }, { status: 502 });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ error: "Invalid response from MCP server", raw: text.slice(0, 200) }, { status: 502 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
