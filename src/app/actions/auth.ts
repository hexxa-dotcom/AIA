"use server";

export async function resolveUsernameToEmail(username: string): Promise<{ ok: boolean; email?: string; error?: string }> {
  try {
    let cleanUsername = username.trim();
    if (cleanUsername.startsWith("@")) {
      cleanUsername = cleanUsername.substring(1);
    }

    if (!cleanUsername) {
      return { ok: false, error: "Username inválido." };
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!projectId || !apiKey) {
      console.error("[AuthAction] Variáveis do Appwrite ausentes no servidor.");
      return { ok: false, error: "Erro de configuração no servidor." };
    }

    const query = encodeURIComponent(JSON.stringify({ method: "equal", attribute: "username", values: [cleanUsername] }));
    const url = `${endpoint}/databases/${databaseId}/collections/usernames/documents?queries[]=${query}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[AuthAction] Erro no Appwrite:", err);
      return { ok: false, error: "Erro de comunicação com o servidor." };
    }

    const data = await res.json();

    if (data.documents && data.documents.length > 0) {
      return { ok: true, email: data.documents[0].email };
    }

    return { ok: false, error: "Username não encontrado." };
  } catch (error) {
    console.error("[AuthAction] Exceção:", error);
    return { ok: false, error: "Erro interno no servidor." };
  }
}

export async function setUsername(userId: string, email: string, username: string): Promise<{ ok: boolean; error?: string }> {
  try {
    let cleanUsername = username.trim();
    if (cleanUsername.startsWith("@")) {
      cleanUsername = cleanUsername.substring(1);
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return { ok: false, error: "Username deve ter ao menos 3 caracteres." };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return { ok: false, error: "Username contém caracteres inválidos." };
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!projectId || !apiKey) {
      return { ok: false, error: "Erro de configuração no servidor." };
    }

    const headers = {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "Content-Type": "application/json",
    };

    // 1. Verificar se já existe outro usuário com esse username
    const query = encodeURIComponent(JSON.stringify({ method: "equal", attribute: "username", values: [cleanUsername] }));
    const searchRes = await fetch(`${endpoint}/databases/${databaseId}/collections/usernames/documents?queries[]=${query}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      const conflict = data.documents?.find((d: any) => d.$id !== userId);
      if (conflict) {
        return { ok: false, error: "Esse username já está em uso." };
      }
    }

    // 2. Atualizar ou Criar o documento do usuário
    const payload = {
      username: cleanUsername,
      email: email
    };
    const permissions = [
      'read("any")',
      `update("user:${userId}")`,
      `delete("user:${userId}")`
    ];

    let res = await fetch(`${endpoint}/databases/${databaseId}/collections/usernames/documents/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ data: payload, permissions }),
    });

    if (res.status === 404) {
      // Cria
      res = await fetch(`${endpoint}/databases/${databaseId}/collections/usernames/documents`, {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId: userId, data: payload, permissions }),
      });
    }

    if (!res.ok) {
      const err = await res.json();
      console.error("[AuthAction] Erro ao salvar username:", err);
      return { ok: false, error: "Erro ao salvar o username." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[AuthAction] Exceção em setUsername:", error);
    return { ok: false, error: "Erro interno no servidor." };
  }
}
