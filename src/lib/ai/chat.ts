export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  provider: string;
  model: string;
  // Opcional: quando vazia, o servidor usa a chave de API padrão configurada.
  apiKey?: string;
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
  model,
  apiKey,
  messages,
  system,
}: ChatRequest): Promise<string> {
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
      model,
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
