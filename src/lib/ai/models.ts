// Modelos disponíveis via OpenRouter (id no formato "vendor/modelo").
// A UI usa isto como sugestões, mas o campo é livre — você pode digitar
// qualquer id válido do OpenRouter (https://openrouter.ai/models).

export interface ModelOption {
  id: string;
  label: string;
  note?: string;
}

export const OPENROUTER_MODELS: ModelOption[] = [
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat", note: "barato — bom p/ sistema" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", note: "ótimo tool-calling" },
  { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash", note: "rápido e barato" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", note: "rápido" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", note: "aberto" },
  { id: "openai/gpt-4o", label: "GPT-4o", note: "premium" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", note: "premium" },
];

// Papéis de modelo: "system" gerencia o sistema (ações, insights — barato),
// "chat" conversa no copilot (qualidade importa mais).
export const DEFAULT_MODELS = {
  system: "deepseek/deepseek-chat",
  chat: "openai/gpt-4o-mini",
} as const;
