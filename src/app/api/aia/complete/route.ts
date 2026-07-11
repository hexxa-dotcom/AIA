import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

// Gateway único de IA via OpenRouter (endpoint compatível com OpenAI).
// A chave vem do corpo (BYOK) ou do OPENROUTER_API_KEY no servidor.
export async function POST(req: Request) {
  try {
    const { model, apiKey, messages } = await req.json();

    const key = (apiKey && apiKey.trim()) || process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Nenhuma chave OpenRouter configurada (Ajustes → IA ou OPENROUTER_API_KEY)." },
        { status: 401 },
      );
    }
    if (!model) {
      return NextResponse.json({ error: "Modelo não especificado." }, { status: 400 });
    }
    if (!messages) {
      return NextResponse.json({ error: "Mensagens ausentes." }, { status: 400 });
    }

    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
    });

    const { text } = await generateText({
      model: openrouter(model),
      messages,
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
