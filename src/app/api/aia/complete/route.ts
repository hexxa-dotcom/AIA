import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { provider, apiKey, messages } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider ou API Key ausente." },
        { status: 400 }
      );
    }

    let model;

    switch (provider) {
      case "openai":
        const openai = createOpenAI({ apiKey });
        model = openai("gpt-4o-mini");
        break;
      case "anthropic":
        const anthropic = createAnthropic({ apiKey });
        model = anthropic("claude-3-5-haiku-latest");
        break;
      case "gemini":
        const google = createGoogleGenerativeAI({ apiKey });
        model = google("gemini-1.5-flash");
        break;
      case "deepseek":
        const deepseek = createOpenAI({
          baseURL: "https://api.deepseek.com/v1",
          apiKey,
        });
        model = deepseek("deepseek-chat");
        break;
      default:
        return NextResponse.json(
          { error: "Provedor inválido." },
          { status: 400 }
        );
    }

    const { text } = await generateText({
      model,
      messages,
      maxOutputTokens: 2000,
    });

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Aia Complete API Error:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno na IA." },
      { status: 500 }
    );
  }
}
