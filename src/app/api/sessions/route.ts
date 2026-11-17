import { randomUUID } from "node:crypto";
import { collection, COLLECTIONS } from "@/db";
import { pub, type PracticeSessionDoc, type SongDoc } from "@/db/schema";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const sessions = await collection<PracticeSessionDoc>(COLLECTIONS.practiceSessions);
  const rows = await sessions
    .aggregate([
      { $lookup: { from: COLLECTIONS.songs, localField: "songId", foreignField: "id", as: "_song" } },
      { $unwind: { path: "$_song", preserveNullAndEmptyArrays: true } },
      { $addFields: { songTitle: "$_song.title", songKind: "$_song.kind" } },
      { $project: { _song: 0, _id: 0 } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
    ])
    .toArray();
  return Response.json(rows);
}

export async function POST(req: Request) {
  // may be sent via navigator.sendBeacon (text/plain), so parse text manually
  const body = JSON.parse((await req.text()) || "null") as { songId?: string; seconds?: number; loops?: number } | null;
  if (!body || !UUID.test(String(body.songId))) return Response.json({ error: "Invalid song" }, { status: 400 });
  const seconds = Math.round(Number(body.seconds) || 0);
  if (seconds < 3) return Response.json({ skipped: true });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const song = await songs.findOne({ id: body.songId! }, { projection: { id: 1 } });
  if (!song) return Response.json({ error: "Not found" }, { status: 404 });
  const doc: PracticeSessionDoc = {
    id: randomUUID(),
    songId: body.songId!,
    seconds: Math.min(seconds, 60 * 60 * 12),
    loops: Math.max(0, Math.round(Number(body.loops) || 0)),
    createdAt: new Date(),
  };
  const sessions = await collection<PracticeSessionDoc>(COLLECTIONS.practiceSessions);
  await sessions.insertOne(doc);
  return Response.json({ ok: true }, { status: 201 });
}