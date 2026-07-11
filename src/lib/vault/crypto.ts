/**
 * Criptografia local zero-knowledge.
 * Master password é derivada via PBKDF2 (200k iterações, SHA-256).
 * Payloads cifrados com AES-GCM 256.
 */

const PBKDF2_ITERATIONS = 200_000;
const KEY_LENGTH_BITS = 256;
const VERIFIER_PLAINTEXT = "aia-vault-verifier-v1";

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function randomSalt(): string {
  const buf = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(buf.buffer);
}

function randomIv(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function deriveKey(masterPassword: string, saltB64: string): Promise<CryptoKey> {
  const salt = fromBase64(saltB64);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // @ts-ignore - SharedArrayBuffer compatibility issue in TypeScript types
      salt: salt.buffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<{ encrypted: string; iv: string }> {
  const iv = randomIv();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM",
      // @ts-ignore - SharedArrayBuffer compatibility issue in TypeScript types
      iv },
    key,
    enc.encode(plaintext),
  );
  return { encrypted: toBase64(ciphertext), iv: toBase64(iv.buffer as ArrayBuffer) };
}

export async function decryptString(key: CryptoKey, ciphertextB64: string, ivB64: string): Promise<string> {
  const iv = fromBase64(ivB64);
  const ciphertext = fromBase64(ciphertextB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM",
      // @ts-ignore - SharedArrayBuffer compatibility issue in TypeScript types
      iv },
    key,
    ciphertext,
  );
  return dec.decode(plain);
}

export async function makeVerifier(key: CryptoKey): Promise<string> {
  const { encrypted, iv } = await encryptString(key, VERIFIER_PLAINTEXT);
  return `${iv}:${encrypted}`;
}

export async function checkVerifier(key: CryptoKey, verifier: string): Promise<boolean> {
  try {
    const [iv, encrypted] = verifier.split(":");
    const out = await decryptString(key, encrypted, iv);
    return out === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

// Gerador de senha forte
export function generatePassword(opts?: {
  length?: number;
  symbols?: boolean;
  digits?: boolean;
  upper?: boolean;
  lower?: boolean;
}): string {
  const length = opts?.length ?? 20;
  const include = {
    lower: opts?.lower ?? true,
    upper: opts?.upper ?? true,
    digits: opts?.digits ?? true,
    symbols: opts?.symbols ?? true,
  };
  const sets: string[] = [];
  if (include.lower) sets.push("abcdefghijklmnopqrstuvwxyz");
  if (include.upper) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (include.digits) sets.push("0123456789");
  if (include.symbols) sets.push("!@#$%^&*()-_=+[]{};:,.?");
  if (sets.length === 0) sets.push("abcdefghijklmnopqrstuvwxyz");
  const all = sets.join("");
  let out = "";
  // garante pelo menos 1 char de cada set escolhido
  for (const s of sets) {
    const idx = crypto.getRandomValues(new Uint32Array(1))[0] % s.length;
    out += s[idx];
  }
  while (out.length < length) {
    const idx = crypto.getRandomValues(new Uint32Array(1))[0] % all.length;
    out += all[idx];
  }
  // embaralha
  return out
    .split("")
    .sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2 ** 31)
    .join("");
}
