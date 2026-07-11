import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";

export const maxDuration = 60; // tempo máximo para a api executar no Vercel (se aplicável)

export async function POST(req: Request) {
  try {
    const { messages, provider, keys, system } = await req.json();

    if (!messages) {
      return new Response("Missing messages", { status: 400 });
    }

    let model;
    
    // Configura o modelo baseado no provedor escolhido
    if (provider === "openai" && keys.openai) {
      const openai = createOpenAI({ apiKey: keys.openai });
      model = openai("gpt-4o-mini");
    } else if (provider === "anthropic" && keys.anthropic) {
      const anthropic = createAnthropic({ apiKey: keys.anthropic });
      model = anthropic("claude-3-5-sonnet-latest");
    } else if (provider === "deepseek" && keys.deepseek) {
      const deepseek = createDeepSeek({ apiKey: keys.deepseek });
      model = deepseek("deepseek-chat");
    } else if (provider === "gemini" && keys.gemini) {
      const google = createGoogleGenerativeAI({ apiKey: keys.gemini });
      model = google("gemini-2.0-flash");
    } else {
      // FALLBACK NATIVO caso nenhuma chave do usuário seja válida ou fornecida
      // No ambiente de produção, GEMINI_API_KEY deve estar configurado na Vercel/servidor
      const fallbackKey = process.env.GEMINI_API_KEY;
      if (!fallbackKey) {
        return new Response("Nenhuma chave configurada e fallback indisponível.", { status: 401 });
      }
      const google = createGoogleGenerativeAI({ apiKey: fallbackKey });
      model = google("gemini-2.0-flash");
    }

    let systemPrompt = system || "Você é a Aia, a assistente de IA integrada ao AIA OS. Ajude o usuário de forma concisa e amigável.";
    const filteredMessages = messages.filter((m: any) => {
      if (m.role === "system") {
        systemPrompt = m.content;
        return false;
      }
      return true;
    });

    // Processar o request com streaming
    const result = streamText({
      model,
      messages: filteredMessages,
      system: systemPrompt,
      // tools: {} -> (Adicionar no futuro para chamadas de função / tool calling)
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Aia Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno no servidor de IA." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
