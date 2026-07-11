export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  provider: string;
  apiKey: string;
  messages: ChatMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function chatComplete({
  provider,
  apiKey,
  messages,
  system,
}: ChatRequest): Promise<string> {
  if (!apiKey?.trim()) {
    throw new AiError(
      400,
      "Chave de IA não configurada. Vá em AIA OS → Configurar.",
    );
  }

  const fullMessages: ChatMessage[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const res = await fetch("/api/aia/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider,
      apiKey,
      messages: fullMessages,
    }),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    throw new AiError(
      res.status,
      err?.error || `Aia erro ${res.status}`,
    );
  }

  const data = await res.json();
  return data.text ?? "";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
