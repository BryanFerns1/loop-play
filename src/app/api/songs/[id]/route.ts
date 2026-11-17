import { collection, COLLECTIONS } from "@/db";
import { pub, type SongDoc } from "@/db/schema";
import { removeFile } from "@/server/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const row = await songs.findOne({ id });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(pub(row));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: Partial<SongDoc> = {};
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim().slice(0, 160);
  if (typeof body.duration === "number" && body.duration > 0) patch.duration = body.duration;
  if (Object.keys(patch).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const row = await songs.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(pub(row));
}

/** POST marks the song as opened for practice (updates "recently played"). */
export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  await songs.updateOne({ id }, { $set: { lastPlayedAt: new Date() }, $inc: { playCount: 1 } });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const row = await songs.findOneAndDelete({ id });
  if (row) await removeFile(row.storageKey);
  return Response.json({ ok: true });
}