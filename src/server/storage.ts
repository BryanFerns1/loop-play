import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * File storage adapter. Currently stores files on local disk.
 * Swap these functions for Supabase / S3 later without touching the routes.
 */
const ROOT = path.join(process.cwd(), "storage", "uploads");

function safeKey(key: string) {
  return path.basename(key);
}

export async function saveFile(key: string, data: Buffer) {
  await mkdir(ROOT, { recursive: true });
  await writeFile(path.join(ROOT, safeKey(key)), data);
}

export async function removeFile(key: string) {
  try {
    await unlink(path.join(ROOT, safeKey(key)));
  } catch {
    /* already gone */
  }
}

export async function fileSize(key: string) {
  try {
    return (await stat(path.join(ROOT, safeKey(key)))).size;
  } catch {
    return null;
  }
}

export function readRange(key: string, start: number, end: number) {
  return createReadStream(path.join(ROOT, safeKey(key)), { start, end });
}
