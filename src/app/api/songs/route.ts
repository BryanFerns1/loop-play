import { randomUUID } from "node:crypto";
import type { Filter } from "mongodb";
import { collection, COLLECTIONS } from "@/db";
import { pub, type SongDoc } from "@/db/schema";
import { removeFile, saveFile } from "@/server/storage";

export const dynamic = "force-dynamic";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const origin = (searchParams.get("origin") ?? "library") as SongDoc["origin"];

  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const filter: Filter<SongDoc> = { origin };
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

  const rows = await songs
    .aggregate([
      { $match: filter },
      { $lookup: { from: COLLECTIONS.sections, localField: "id", foreignField: "songId", as: "_sections" } },
      { $addFields: { sectionCount: { $size: "$_sections" } } },
      { $project: { _sections: 0, _id: 0 } },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();
  return Response.json(rows);
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  const mime = file.type || "";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const videoExt = ["mp4", "m4v", "mov", "webm", "mkv", "ogv"];
  const audioExt = ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "opus", "weba"];
  const isVideo = mime.startsWith("video/") || (!mime.startsWith("audio/") && videoExt.includes(ext));
  const isAudio = mime.startsWith("audio/") || audioExt.includes(ext);
  if (!isVideo && !isAudio) {
    return Response.json({ error: "Please upload an audio or video file" }, { status: 400 });
  }
  const rawTitle = String(form.get("title") ?? "").trim();
  const title = rawTitle || file.name.replace(/\.[^.]+$/, "") || "Untitled";
  const duration = Math.max(0, Number(form.get("duration")) || 0);
  const origin: SongDoc["origin"] = form.get("origin") === "shared" ? "shared" : "library";
  const storageKey = `${randomUUID()}${ext ? "." + ext.replace(/[^a-z0-9]/g, "") : ""}`;

  await saveFile(storageKey, Buffer.from(await file.arrayBuffer()));
  try {
    const doc: SongDoc = {
      id: randomUUID(),
      title: title.slice(0, 160),
      kind: isVideo ? "video" : "audio",
      origin,
      mimeType: mime || (isVideo ? "video/mp4" : "audio/mpeg"),
      fileName: file.name,
      storageKey,
      size: file.size,
      duration,
      playCount: 0,
      lastPlayedAt: null,
      createdAt: new Date(),
    };
    const songs = await collection<SongDoc>(COLLECTIONS.songs);
    await songs.insertOne(doc);
    return Response.json(pub(doc), { status: 201 });
  } catch {
    await removeFile(storageKey);
    return Response.json({ error: "Could not save song" }, { status: 500 });
  }
}