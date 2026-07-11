import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, provider, apiKey } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Texto ausente." }, { status: 400 });
    }

    let embeddingModel;

    // Se o usuário usa OpenAI
    if (provider === "openai" && apiKey) {
      const openai = createOpenAI({ apiKey });
      embeddingModel = openai.embedding("text-embedding-3-small");
    } 
    // Se o usuário usa Gemini
    else if (provider === "gemini" && apiKey) {
      const google = createGoogleGenerativeAI({ apiKey });
      embeddingModel = google.textEmbeddingModel("gemini-embedding-2");
    } 
    // Fallback nativo: usar a chave de ambiente do Gemini se disponível
    else {
      const fallbackKey = process.env.GEMINI_API_KEY;
      if (!fallbackKey) {
        return NextResponse.json({ error: "Nenhuma chave de embedding disponível." }, { status: 401 });
      }
      const google = createGoogleGenerativeAI({ apiKey: fallbackKey });
      embeddingModel = google.textEmbeddingModel("gemini-embedding-2");
    }

    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    });

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Aia Embeddings API Error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar embedding." },
      { status: 500 }
    );
  }
}
