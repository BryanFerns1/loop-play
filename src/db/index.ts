import { MongoClient, type Db, type Document } from "mongodb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __choirloopMongoClient?: MongoClient;
};

const client =
  globalForDb.__choirloopMongoClient ?? new MongoClient(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__choirloopMongoClient = client;
}

let connected = false;

export async function getDb(): Promise<Db> {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db(process.env.DATABASE_NAME || "choirloop");
}

export async function collection<T extends Document>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

/** Collections used by the app. */
export const COLLECTIONS = {
  songs: "songs",
  sections: "sections",
  practiceSessions: "practice_sessions",
  sharedMaterials: "shared_materials",
} as const;