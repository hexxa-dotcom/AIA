import { getAppwrite } from "@/lib/appwrite";
import { useAuthStore } from "@/store/useAuthStore";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
const MEMORIES_COLLECTION_ID = "memories";

export interface MemoryItem {
  id: string;
  content: string;
  createdAt: number;
  score?: number;
}

// Calcula a similaridade de cosseno entre dois vetores
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Gera o embedding chamando nossa rota de API
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("/api/aia/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `Erro ao gerar embedding: ${res.status}`);
  }

  const data = await res.json();
  return data.embedding;
}

// Salva um novo fato ou memória no Appwrite
export async function saveMemory(content: string): Promise<string> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Usuário não autenticado.");

  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado.");

  // 1. Gerar embedding do texto
  const embedding = await generateEmbedding(content);

  // 2. Salvar no banco
  const docId = ID.unique();
  const docData = {
    userId: user.id,
    content,
    embedding,
    createdAt: Date.now(),
  };

  const permissions = [
    `read("user:${user.id}")`,
    `update("user:${user.id}")`,
    `delete("user:${user.id}")`,
  ];

  await databases.createDocument(
    DATABASE_ID,
    MEMORIES_COLLECTION_ID,
    docId,
    docData,
    permissions
  );

  return docId;
}

// Busca as memórias mais relevantes por similaridade semântica
export async function searchMemories(query: string, limit: number = 5): Promise<MemoryItem[]> {
  const user = useAuthStore.getState().user;
  if (!user) return [];

  const { databases } = getAppwrite();
  if (!databases) return [];

  try {
    // 1. Gerar o embedding da query de busca
    const queryVector = await generateEmbedding(query);

    // 2. Listar todas as memórias do usuário (como são pequenos fatos sobre o usuário, listAll é seguro e rápido)
    let allDocs: any[] = [];
    let offset = 0;
    const limitBatch = 100;

    while (true) {
      const res = await databases.listDocuments(
        DATABASE_ID,
        MEMORIES_COLLECTION_ID,
        [
          Query.equal("userId", user.id),
          Query.limit(limitBatch),
          Query.offset(offset),
        ]
      );
      allDocs = allDocs.concat(res.documents);
      if (res.documents.length < limitBatch) break;
      offset += limitBatch;
    }

    if (allDocs.length === 0) return [];

    // 3. Calcular a similaridade e ordenar
    const scored = allDocs
      .map((doc) => {
        const score = cosineSimilarity(queryVector, doc.embedding || []);
        return {
          id: doc.$id,
          content: doc.content,
          createdAt: doc.createdAt,
          score,
        };
      })
      // Filtra por similaridades mínimas aceitáveis (ex: > 0.35 para embeddings normais)
      .filter((m) => m.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error("Falha ao buscar memórias semânticas:", error);
    return [];
  }
}
