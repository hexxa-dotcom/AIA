import { chatComplete, type ChatMessage } from "./chat";
import type { Task } from "@/lib/types";

const SYSTEM_PROMPT = `Você é um assistente de produtividade. O usuário tem uma tarefa e precisa quebrá-la em subtarefas pequenas, específicas e acionáveis em português brasileiro.

Regras:
- Cada subtarefa deve ser concreta e executável em até ~30 minutos
- Use verbo no infinitivo no início (ex: "Levantar", "Escrever", "Conferir")
- Entre 3 e 8 subtarefas no total
- Ordem lógica de execução

Responda APENAS com um JSON válido no formato:
{"subtasks": ["primeira subtarefa", "segunda subtarefa", "..."]}

Sem markdown, sem explicações, só o JSON.`;

export async function suggestSubtasks(opts: {
  provider: string;
  apiKey?: string;
  model: string;
  task: Pick<Task, "title" | "description" | "subtasks">;
  extraContext?: string;
}): Promise<string[]> {
  const existing = opts.task.subtasks.length > 0
    ? `\n\nSubtarefas já existentes (não repita estas):\n${opts.task.subtasks.map((s) => `- ${s.title}`).join("\n")}`
    : "";

  const userPrompt = `Quebre esta tarefa em subtarefas:

Título: ${opts.task.title}
${opts.task.description ? `Descrição: ${opts.task.description}` : ""}${existing}${opts.extraContext ? `\n\nContexto extra do usuário:\n${opts.extraContext}` : ""}`;

  const messages: ChatMessage[] = [{ role: "user", content: userPrompt }];

  const raw = await chatComplete({
    provider: opts.provider,
    apiKey: opts.apiKey,
    model: opts.model,
    messages,
    system: SYSTEM_PROMPT,
    maxTokens: 800,
    temperature: 0.4,
  });

  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: { subtasks?: string[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("IA não retornou JSON válido");
    parsed = JSON.parse(match[0]);
  }
  if (!Array.isArray(parsed.subtasks)) throw new Error("Resposta sem array 'subtasks'");
  return parsed.subtasks
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}
