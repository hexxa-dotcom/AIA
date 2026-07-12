import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

// Gateway único de IA via OpenRouter (endpoint compatível com OpenAI).
// A chave vem do corpo (BYOK) ou do OPENROUTER_API_KEY no servidor.
export async function POST(req: Request) {
  try {
    const { provider, model, apiKey, messages } = await req.json();

    const isGroq = provider === "groq";
    const key = (apiKey && apiKey.trim()) || (isGroq ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY);

    if (!key) {
      return NextResponse.json(
        { 
          error: isGroq 
            ? "Nenhuma chave Groq configurada (Ajustes → IA ou GROQ_API_KEY no servidor)."
            : "Nenhuma chave OpenRouter configurada (Ajustes → IA ou OPENROUTER_API_KEY no servidor)."
        },
        { status: 401 },
      );
    }
    if (!model) {
      return NextResponse.json({ error: "Modelo não especificado." }, { status: 400 });
    }
    if (!messages) {
      return NextResponse.json({ error: "Mensagens ausentes." }, { status: 400 });
    }

    const client = createOpenAI({
      baseURL: isGroq ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1",
      apiKey: key,
    });

    // Filtragem de mensagens de sistema para compatibilidade
    let systemPrompt = "";
    const filteredMessages = messages.filter((m: any) => {
      if (m.role === "system") {
        systemPrompt = m.content;
        return false;
      }
      return true;
    });

    const { text } = await generateText({
      model: client.chat(model),
      system: systemPrompt || undefined,
      messages: filteredMessages,
      maxOutputTokens: 2000,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Aia Complete API Error:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno na IA." },
      { status: 500 },
    );
  }
}
