export const motivationalMessages = [
  { text: "A única maneira de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs" },
  { text: "Não importa o quão devagar você vá, desde que você não pare.", author: "Confúcio" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Acredite que você pode, e você já está na metade do caminho.", author: "Theodore Roosevelt" },
  { text: "O que nos parece uma provação amarga pode ser uma bênção disfarçada.", author: "Oscar Wilde" },
  { text: "Seja a mudança que você deseja ver no mundo.", author: "Mahatma Gandhi" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "Você não precisa ser grande para começar, mas precisa começar para ser grande.", author: "Zig Ziglar" },
  { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "Tudo o que a mente humana pode conceber, ela pode conquistar.", author: "Napoleon Hill" },
];

export function getTodaysMessage(): { text: string; author: string } {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24,
  );
  return motivationalMessages[dayOfYear % motivationalMessages.length];
}
