const fs = require('fs');
const path = require('path');

// 1. Ler variáveis do .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("❌ Arquivo .env.local não encontrado! Crie um baseado no .env.example.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.substring(0, index).trim();
    const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  });
  return env;
}

const env = loadEnv();

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'aia';
const API_KEY = env.APPWRITE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error("❌ NEXT_PUBLIC_APPWRITE_PROJECT_ID e APPWRITE_API_KEY são necessários no .env.local!");
  process.exit(1);
}

// Helper para fazer requisições HTTP à API do Appwrite
async function request(method, path, body = null) {
  const url = `${ENDPOINT}${path}`;
  const headers = {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.message || res.statusText, raw: data };
  }

  return data;
}

// Helpers para aguardar a criação assíncrona
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitAttributeReady(collectionId, key) {
  while (true) {
    try {
      const attr = await request('GET', `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${key}`);
      if (attr.status === 'available') break;
      if (attr.status === 'failed') throw new Error(`Attribute ${key} failed creation`);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    await delay(300);
  }
}

async function waitIndexReady(collectionId, key) {
  while (true) {
    try {
      const idx = await request('GET', `/databases/${DATABASE_ID}/collections/${collectionId}/indexes/${key}`);
      if (idx.status === 'available') break;
      if (idx.status === 'failed') throw new Error(`Index ${key} failed creation`);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    await delay(300);
  }
}

// Coleções e seus atributos/índices
const schema = {
  boards: {
    name: "Boards",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "name", type: "string", size: 255, required: true },
      { key: "emoji", type: "string", size: 255, required: false },
      { key: "createdAt", type: "integer", required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  tasks: {
    name: "Tasks",
    attributes: [
      { key: "boardId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true },
      { key: "column", type: "string", size: 50, required: true },
      { key: "order", type: "integer", required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "description", type: "string", size: 5000, required: false },
      { key: "priority", type: "string", size: 50, required: true },
      { key: "dueDate", type: "integer", required: false },
      { key: "startDate", type: "integer", required: false },
      { key: "scheduledStart", type: "integer", required: false },
      { key: "scheduledEnd", type: "integer", required: false },
      { key: "coverColor", type: "string", size: 50, required: false },
      { key: "tags", type: "string", size: 255, required: false, array: true },
      { key: "totalTimeSec", type: "integer", required: false, default: 0 },
      { key: "hourlyRate", type: "float", required: false },
      { key: "completedAt", type: "integer", required: false },
      { key: "createdAt", type: "integer", required: true },
      { key: "updatedAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] },
      { key: "boardId_idx", type: "key", attributes: ["boardId"] }
    ]
  },
  subtasks: {
    name: "Subtasks",
    attributes: [
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "done", type: "boolean", required: false, default: false },
      { key: "doneAt", type: "integer", required: false },
      { key: "position", type: "integer", required: false, default: 0 },
      { key: "createdAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "taskId_idx", type: "key", attributes: ["taskId"] },
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  time_entries: {
    name: "Time Entries",
    attributes: [
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true },
      { key: "startedAt", type: "integer", required: true },
      { key: "endedAt", type: "integer", required: false },
      { key: "durationSec", type: "integer", required: false, default: 0 },
      { key: "note", type: "string", size: 1000, required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] },
      { key: "taskId_idx", type: "key", attributes: ["taskId"] }
    ]
  },
  routine_blocks: {
    name: "Routine Blocks",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "emoji", type: "string", size: 50, required: false },
      { key: "startMinute", type: "integer", required: true },
      { key: "endMinute", type: "integer", required: true },
      { key: "recurrence", type: "string", size: 50, required: true },
      { key: "weekdays", type: "integer", required: false, array: true },
      { key: "color", type: "string", size: 50, required: false },
      { key: "isFlexible", type: "boolean", required: false, default: false },
      { key: "createdAt", type: "integer", required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  game_state: {
    name: "Game State",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "xp", type: "integer", required: false, default: 0 },
      { key: "level", type: "integer", required: false, default: 1 },
      { key: "streakDays", type: "integer", required: false, default: 0 },
      { key: "lastActiveDay", type: "string", size: 50, required: false },
      { key: "updatedAt", type: "integer", required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  achievements: {
    name: "Achievements",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "key", type: "string", size: 255, required: true },
      { key: "unlockedAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  xp_events: {
    name: "XP Events",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "amount", type: "integer", required: true },
      { key: "reason", type: "string", size: 255, required: false },
      { key: "at", type: "integer", required: true }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  task_assignees: {
    name: "Task Assignees",
    attributes: [
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true }
    ],
    indexes: [
      { key: "taskId_idx", type: "key", attributes: ["taskId"] },
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  dm_messages: {
    name: "DM Messages",
    attributes: [
      { key: "fromUser", type: "string", size: 255, required: true },
      { key: "toUser", type: "string", size: 255, required: true },
      { key: "body", type: "string", size: 5000, required: false },
      { key: "taskRef", type: "string", size: 255, required: false },
      { key: "readAt", type: "integer", required: false },
      { key: "createdAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "fromUser_idx", type: "key", attributes: ["fromUser"] },
      { key: "toUser_idx", type: "key", attributes: ["toUser"] }
    ]
  },
  workspace_members: {
    name: "Workspace Members",
    attributes: [
      { key: "userId", type: "string", size: 255, required: false },
      { key: "email", type: "string", size: 255, required: true },
      { key: "name", type: "string", size: 255, required: false },
      { key: "invitedBy", type: "string", size: 255, required: false },
      { key: "invitedAt", type: "integer", required: true },
      { key: "joinedAt", type: "integer", required: false }
    ],
    indexes: [
      { key: "email_idx", type: "key", attributes: ["email"] }
    ]
  },
  task_comments: {
    name: "Task Comments",
    attributes: [
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: true },
      { key: "body", type: "string", size: 5000, required: true },
      { key: "mentions", type: "string", size: 255, required: false, array: true },
      { key: "createdAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "taskId_idx", type: "key", attributes: ["taskId"] }
    ]
  },
  task_activity: {
    name: "Task Activity",
    attributes: [
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "userId", type: "string", size: 255, required: false },
      { key: "action", type: "string", size: 50, required: true },
      { key: "payload", type: "string", size: 5000, required: false },
      { key: "at", type: "integer", required: true }
    ],
    indexes: [
      { key: "taskId_idx", type: "key", attributes: ["taskId"] }
    ]
  },
  vault_meta: {
    name: "Vault Meta",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "verifier", type: "string", size: 512, required: true },
      { key: "salt", type: "string", size: 255, required: true },
      { key: "updatedAt", type: "string", size: 50, required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  vault_items: {
    name: "Vault Items",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "category", type: "string", size: 100, required: false },
      { key: "encryptedPayload", type: "string", size: 20000, required: true },
      { key: "iv", type: "string", size: 255, required: true },
      { key: "createdAt", type: "string", size: 50, required: false },
      { key: "updatedAt", type: "string", size: 50, required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  reminders: {
    name: "Reminders",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "taskId", type: "string", size: 255, required: true },
      { key: "remindAt", type: "integer", required: true },
      { key: "channel", type: "string", size: 50, required: true },
      { key: "message", type: "string", size: 1000, required: false },
      { key: "sentAt", type: "integer", required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  expenses: {
    name: "Expenses",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "name", type: "string", size: 255, required: true },
      { key: "amount", type: "float", required: true },
      { key: "dueDay", type: "integer", required: true },
      { key: "category", type: "string", size: 50, required: true },
      { key: "group", type: "string", size: 255, required: true },
      { key: "notes", type: "string", size: 5000, required: false },
      { key: "isActive", type: "boolean", required: true },
      { key: "createdAt", type: "integer", required: true },
      { key: "tipo", type: "string", size: 50, required: true },
      { key: "totalParcelas", type: "integer", required: false },
      { key: "parcelaInicio", type: "string", size: 50, required: false },
      { key: "isCartao", type: "boolean", required: true },
      { key: "cartaoNome", type: "string", size: 255, required: false },
      { key: "payments", type: "string", size: 5000, required: true },
      { key: "imovel", type: "string", size: 255, required: false },
      { key: "familyMember", type: "string", size: 255, required: false },
      { key: "sharedWith", type: "string", size: 255, required: false, array: true },
      { key: "sharedBy", type: "string", size: 255, required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  expense_invites: {
    name: "Expense Invites",
    attributes: [
      { key: "fromEmail", type: "string", size: 255, required: true },
      { key: "fromName", type: "string", size: 255, required: false },
      { key: "toEmail", type: "string", size: 255, required: true },
      { key: "expense", type: "string", size: 10000, required: true },
      { key: "status", type: "string", size: 50, required: true },
      { key: "createdAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "toEmail_idx", type: "key", attributes: ["toEmail"] },
      { key: "fromEmail_idx", type: "key", attributes: ["fromEmail"] }
    ]
  },
  appointments: {
    name: "Appointments",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "date", type: "integer", required: true },
      { key: "endDate", type: "integer", required: false },
      { key: "type", type: "string", size: 50, required: true },
      { key: "description", type: "string", size: 5000, required: false },
      { key: "allDay", type: "boolean", required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  studies: {
    name: "Studies",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "type", type: "string", size: 50, required: true },
      { key: "title", type: "string", size: 255, required: true },
      { key: "authorOrProvider", type: "string", size: 255, required: false },
      { key: "status", type: "string", size: 50, required: true },
      { key: "currentProgress", type: "integer", required: true },
      { key: "totalProgress", type: "integer", required: true },
      { key: "coverUrl", type: "string", size: 1000, required: false },
      { key: "emoji", type: "string", size: 50, required: false }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  },
  memories: {
    name: "Memories",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "content", type: "string", size: 5000, required: true },
      { key: "embedding", type: "float", required: true, array: true },
      { key: "createdAt", type: "integer", required: true }
    ],
    indexes: [
      { key: "userId_idx", type: "key", attributes: ["userId"] }
    ]
  }
};

async function main() {
  console.log("🚀 Iniciando configuração do Appwrite...");

  // 1. Verificar/Criar o Banco de Dados
  let dbExists = false;
  try {
    console.log(`\n📦 Verificando existência do Banco de Dados: "${DATABASE_ID}"...`);
    await request('GET', `/databases/${DATABASE_ID}`);
    dbExists = true;
    console.log(`ℹ️ Banco de Dados "${DATABASE_ID}" já existe.`);
  } catch (e) {
    if (e.status !== 404) {
      console.error("❌ Falha ao verificar Banco de Dados:", e.message);
      process.exit(1);
    }
  }

  if (!dbExists) {
    try {
      console.log(`📦 Criando Banco de Dados: "${DATABASE_ID}"...`);
      await request('POST', '/databases', {
        databaseId: DATABASE_ID,
        name: "AIA"
      });
      console.log(`✅ Banco de Dados "${DATABASE_ID}" criado com sucesso!`);
    } catch (e) {
      if (e.status === 409) {
        console.log(`ℹ️ Banco de Dados "${DATABASE_ID}" já existe.`);
      } else {
        console.error("❌ Falha ao criar o Banco de Dados:", e.message);
        process.exit(1);
      }
    }
  }

  // 2. Criar coleções, atributos e índices
  for (const [collId, collData] of Object.entries(schema)) {
    console.log(`\n📂 [${collData.name}] Verificando/Criando Coleção: "${collId}"...`);
    
    // Criar Coleção
    let collectionExists = false;
    try {
      await request('POST', `/databases/${DATABASE_ID}/collections`, {
        collectionId: collId,
        name: collData.name,
        permissions: [
          'create("users")',
          'read("users")',
          'update("users")',
          'delete("users")'
        ],
        documentSecurity: true
      });
      console.log(`   ✅ Coleção "${collId}" criada.`);
    } catch (e) {
      if (e.status === 409) {
        console.log(`   ℹ️ Coleção "${collId}" já existe.`);
        collectionExists = true;
      } else {
        console.error(`   ❌ Erro ao criar coleção "${collId}":`, e.message);
        continue;
      }
    }

    // Criar Atributos
    console.log(`   ⚙️ Criando atributos para "${collId}"...`);
    for (const attr of collData.attributes) {
      try {
        let pathAttr = `/databases/${DATABASE_ID}/collections/${collId}/attributes/`;
        const bodyAttr = {
          key: attr.key,
          required: attr.required,
          array: attr.array || false
        };

        if (attr.type === 'string') {
          pathAttr += 'string';
          bodyAttr.size = attr.size || 255;
        } else if (attr.type === 'integer') {
          pathAttr += 'integer';
          if (attr.default !== undefined) bodyAttr.default = attr.default;
        } else if (attr.type === 'boolean') {
          pathAttr += 'boolean';
          if (attr.default !== undefined) bodyAttr.default = attr.default;
        } else if (attr.type === 'float') {
          pathAttr += 'float';
        }

        await request('POST', pathAttr, bodyAttr);
        console.log(`      ➕ Atributo "${attr.key}" solicitado...`);
        await waitAttributeReady(collId, attr.key);
        console.log(`      ✔️ Atributo "${attr.key}" disponível!`);
      } catch (e) {
        if (e.status === 409) {
          console.log(`      ℹ️ Atributo "${attr.key}" já existe.`);
        } else {
          console.error(`      ❌ Erro no atributo "${attr.key}":`, e.message);
        }
      }
    }

    // Criar Índices
    console.log(`   🔍 Criando índices para "${collId}"...`);
    for (const idx of collData.indexes) {
      try {
        await request('POST', `/databases/${DATABASE_ID}/collections/${collId}/indexes`, {
          key: idx.key,
          type: idx.type,
          attributes: idx.attributes,
          orders: idx.orders || idx.attributes.map(() => "ASC")
        });
        console.log(`      ➕ Índice "${idx.key}" solicitado...`);
        await waitIndexReady(collId, idx.key);
        console.log(`      ✔️ Índice "${idx.key}" disponível!`);
      } catch (e) {
        if (e.status === 409) {
          console.log(`      ℹ️ Índice "${idx.key}" já existe.`);
        } else {
          console.error(`      ❌ Erro no índice "${idx.key}":`, e.message);
        }
      }
    }
  }

  console.log("\n🎉 Configuração do Appwrite finalizada com sucesso!");
}

main().catch(err => {
  console.error("❌ Erro inesperado:", err);
});
