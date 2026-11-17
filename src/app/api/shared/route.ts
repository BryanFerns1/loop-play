import { randomUUID } from "node:crypto";
import { collection, COLLECTIONS } from "@/db";
import { pub, type SharedMaterialDoc, type SongDoc } from "@/db/schema";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const shared = await collection<SharedMaterialDoc>(COLLECTIONS.sharedMaterials);
  const rows = await shared
    .aggregate([
      { $lookup: { from: COLLECTIONS.songs, localField: "songId", foreignField: "id", as: "_song" } },
      { $unwind: { path: "$_song", preserveNullAndEmptyArrays: true } },
      { $addFields: { kind: "$_song.kind", duration: "$_song.duration" } },
      { $project: { _song: 0, _id: 0 } },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!UUID.test(String(body?.songId))) return Response.json({ error: "Choose a song to share" }, { status: 400 });
  const instructor = typeof body.instructor === "string" ? body.instructor.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!instructor) return Response.json({ error: "Instructor name is required" }, { status: 400 });
  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const song = await songs.findOne({ id: body.songId }, { projection: { id: 1 } });
  if (!song) return Response.json({ error: "Song not found" }, { status: 404 });
  const doc: SharedMaterialDoc = {
    id: randomUUID(),
    songId: body.songId,
    title: title.slice(0, 160),
    instructor: instructor.slice(0, 80),
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "",
    createdAt: new Date(),
  };
  const shared = await collection<SharedMaterialDoc>(COLLECTIONS.sharedMaterials);
  await shared.insertOne(doc);
  return Response.json(pub(doc), { status: 201 });
}