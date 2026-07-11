export const GROQ_MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (recomendado)",
    recommended: true,
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B (mais rápido)",
    recommended: false as const,
  },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", recommended: false as const },
  {
    id: "mixtral-8x7b-32768",
    label: "Mixtral 8x7B",
    recommended: false as const,
  },
  {
    id: "llama-3.3-70b-specdec",
    label: "Llama 3.3 70B SpecDec",
    recommended: false as const,
  },
] as const;

export type GroqModelId = (typeof GROQ_MODELS)[number]["id"];

// Mantido por compatibilidade com código que usa ProviderId
export type ProviderId = "groq";
export const PROVIDER_ORDER: ProviderId[] = ["groq"];
export const PROVIDERS = {
  groq: {
    id: "groq" as ProviderId,
    name: "Groq",
    shortName: "Groq",
    emoji: "",
    apiKeyUrl: "https://console.groq.com/keys",
    apiKeyHelp: "Crie em console.groq.com → API Keys (gratuito)",
    models: GROQ_MODELS,
  },
};
