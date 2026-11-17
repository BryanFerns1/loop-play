import { randomUUID } from "node:crypto";
import { collection, COLLECTIONS } from "@/db";
import { pub, type SectionDoc } from "@/db/schema";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const songId = new URL(req.url).searchParams.get("songId");
  if (songId && !UUID.test(songId)) return Response.json([]);

  const sections = await collection<SectionDoc>(COLLECTIONS.sections);
  const match = songId ? { songId } : {};
  const rows = await sections
    .aggregate([
      { $match: match },
      { $lookup: { from: COLLECTIONS.songs, localField: "songId", foreignField: "id", as: "_song" } },
      { $unwind: { path: "$_song", preserveNullAndEmptyArrays: true } },
      { $addFields: { songTitle: "$_song.title", songKind: "$_song.kind" } },
      { $project: { _song: 0, _id: 0 } },
      { $sort: songId ? { startTime: 1 } : { createdAt: -1 } },
    ])
    .toArray();
  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const start = Number(body?.startTime);
  const end = Number(body?.endTime);
  if (!UUID.test(String(body?.songId))) return Response.json({ error: "Invalid song" }, { status: 400 });
  if (!name) return Response.json({ error: "Section name is required" }, { status: 400 });
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
    return Response.json({ error: "End must be after start" }, { status: 400 });
  }
  const now = new Date();
  const doc: SectionDoc = {
    id: randomUUID(),
    songId: body.songId,
    name: name.slice(0, 80),
    startTime: start,
    endTime: end,
    createdAt: now,
    updatedAt: now,
  };
  const sections = await collection<SectionDoc>(COLLECTIONS.sections);
  await sections.insertOne(doc);
  return Response.json(pub(doc), { status: 201 });
}