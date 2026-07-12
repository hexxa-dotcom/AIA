export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Record<string, Quote[]> = {
  famous: [
    { text: "A única maneira de fazer um excelente trabalho é amar o que você faz.", author: "Steve Jobs" },
    { text: "Não importa o quão devagar você vá, desde que você não pare.", author: "Confúcio" },
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "Acredite que você pode, e você já está na metade do caminho.", author: "Theodore Roosevelt" },
    { text: "Seja a mudança que você deseja ver no mundo.", author: "Mahatma Gandhi" },
    { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  ],
  biblia: [
    { text: "Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", author: "Provérbios 16:3" },
    { text: "O coração alegre afeiçoa o rosto, mas pela dor do coração o espírito se abate.", author: "Provérbios 15:13" },
    { text: "Como o ferro com o ferro se afia, assim o homem ao seu amigo.", author: "Provérbios 27:17" },
    { text: "Os planos bem elaborados levam à fartura; a pressa apressada, à miséria.", author: "Provérbios 21:5" },
    { text: "O preguiçoso deseja e nada tem, mas o desejo dos que trabalham é plenamente satisfeito.", author: "Provérbios 13:4" },
    { text: "Melhor é o fim das coisas do que o começo delas; melhor é o paciente do que o orgulhoso.", author: "Eclesiastes 7:8" },
  ],
  stoic: [
    { text: "A felicidade da sua vida depende da qualidade dos seus pensamentos.", author: "Marco Aurélio" },
    { text: "Sofremos mais frequentemente na imaginação do que na realidade.", author: "Sêneca" },
    { text: "Não são as coisas que nos perturbam, mas os nossos julgamentos sobre as coisas.", author: "Epicteto" },
    { text: "A melhor vingança contra um inimigo é ser diferente dele.", author: "Marco Aurélio" },
    { text: "Enquanto adiamos, a vida corre.", author: "Sêneca" },
    { text: "Nenhum homem é livre se não for senhor de si mesmo.", author: "Epicteto" },
  ],
  startup: [
    { text: "Feito é melhor do que perfeito.", author: "Sheryl Sandberg" },
    { text: "Se você não está envergonhado com a primeira versão do seu produto, você lançou tarde demais.", author: "Reid Hoffman" },
    { text: "Ideias são fáceis. A execução é tudo.", author: "John Doerr" },
    { text: "Seja obstinado na visão, mas flexível nos detalhes.", author: "Jeff Bezos" },
    { text: "O maior risco é não correr nenhum risco.", author: "Mark Zuckerberg" },
    { text: "Foque em criar valor, não em criar barulho.", author: "Paul Graham" },
  ]
};

export function getTodaysMessage(style: string = "famous"): Quote {
  const category = QUOTES[style] || QUOTES.famous;
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      1000 / 60 / 60 / 24,
  );
  return category[dayOfYear % category.length];
}
