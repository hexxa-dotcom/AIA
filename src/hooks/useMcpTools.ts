"use client";
import { useEffect, useState, useCallback } from "react";
import { useMcpServersStore, type McpServer } from "@/store/useMcpServersStore";

export interface McpTool {
  serverUrl: string;
  serverName: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

async function proxyCall(serverUrl: string, method: string, params?: unknown) {
  const res = await fetch("/api/mcp/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serverUrl, method, params }),
  });
  return res.json();
}

async function initServer(server: McpServer): Promise<McpTool[]> {
  try {
    await proxyCall(server.url, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hexxa", version: "1.0" },
    });
    const resp = await proxyCall(server.url, "tools/list");
    const tools: McpTool[] = (resp?.result?.tools ?? []).map((t: Record<string, unknown>) => ({
      serverUrl: server.url,
      serverName: server.name,
      name: t.name as string,
      description: (t.description as string) ?? "",
      inputSchema: t.inputSchema as Record<string, unknown> | undefined,
    }));
    return tools;
  } catch {
    return [];
  }
}

export async function callMcpTool(serverUrl: string, name: string, args: Record<string, unknown>) {
  const resp = await proxyCall(serverUrl, "tools/call", { name, arguments: args });
  const content = resp?.result?.content;
  if (Array.isArray(content)) {
    return content.map((c: Record<string, unknown>) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
  }
  return JSON.stringify(resp?.result ?? resp?.error ?? resp);
}

export function useMcpTools() {
  const servers = useMcpServersStore((s) => s.servers);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const enabled = servers.filter((s) => s.enabled);
    if (enabled.length === 0) { setTools([]); return; }
    setLoading(true);
    const results = await Promise.all(enabled.map(initServer));
    setTools(results.flat());
    setLoading(false);
  }, [servers]);

  useEffect(() => { refresh(); }, [refresh]);

  return { tools, loading, refresh };
}
