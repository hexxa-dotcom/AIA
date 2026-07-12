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

export const GROQ_MODELS: ModelOption[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Versatile)", note: "Recomendado - Excelente qualidade" },
  { id: "llama-3.3-70b-specdec", label: "Llama 3.3 70B SpecDec", note: "Super rápido" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Instant)", note: "Ultra veloz" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7b", note: "Bom para raciocínio" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", note: "Modelo do Google no Groq" },
];

// Papéis de modelo: "system" gerencia o sistema (ações, insights — barato),
// "chat" conversa no copilot (qualidade importa mais).
export const DEFAULT_MODELS = {
  system: "deepseek/deepseek-chat",
  chat: "openai/gpt-4o-mini",
  groqSystem: "llama-3.1-8b-instant",
  groqChat: "llama-3.3-70b-versatile",
} as const;
