const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
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

async function request(method, urlPath, body = null) {
  const url = `${ENDPOINT}${urlPath}`;
  const options = {
    method,
    headers: {
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
      'Content-Type': 'application/json'
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || res.statusText };
  return data;
}

async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function main() {
  console.log("Criando coleção usernames...");
  try {
    await request('POST', `/databases/${DATABASE_ID}/collections`, {
      collectionId: 'usernames',
      name: 'Usernames',
      permissions: [
        'read("any")',
        'create("users")',
        'update("users")',
        'delete("users")'
      ],
      documentSecurity: true
    });
    console.log("Coleção usernames criada.");
  } catch (e) {
    if (e.status === 409) console.log("Coleção usernames já existe.");
    else throw e;
  }

  // Atributos
  const attrs = [
    { key: "username", type: "string", size: 50, required: true },
    { key: "email", type: "string", size: 255, required: true }
  ];

  for (const attr of attrs) {
    try {
      await request('POST', `/databases/${DATABASE_ID}/collections/usernames/attributes/string`, attr);
      console.log(`Atributo ${attr.key} solicitado...`);
      while (true) {
        try {
          const res = await request('GET', `/databases/${DATABASE_ID}/collections/usernames/attributes/${attr.key}`);
          if (res.status === 'available') break;
        } catch (e) { if (e.status !== 404) throw e; }
        await delay(500);
      }
      console.log(`Atributo ${attr.key} disponível.`);
    } catch (e) {
      if (e.status === 409) console.log(`Atributo ${attr.key} já existe.`);
      else throw e;
    }
  }

  // Indice unico
  try {
    await request('POST', `/databases/${DATABASE_ID}/collections/usernames/indexes`, {
      key: 'username_unique_idx',
      type: 'unique',
      attributes: ['username'],
      orders: ['ASC']
    });
    console.log("Índice unique solicitado...");
    while (true) {
      try {
        const res = await request('GET', `/databases/${DATABASE_ID}/collections/usernames/indexes/username_unique_idx`);
        if (res.status === 'available') break;
      } catch (e) { if (e.status !== 404) throw e; }
      await delay(500);
    }
    console.log("Índice unique disponível.");
  } catch (e) {
    if (e.status === 409) console.log("Índice já existe.");
    else throw e;
  }

  console.log("Finalizado!");
}
main().catch(console.error);
