import { randomUUID } from "node:crypto";
import { collection, COLLECTIONS } from "@/db";
import { pub, type SharedMaterialDoc, type SongDoc } from "@/db/schema";
import { saveFile } from "@/server/storage";
import { generateSampleWav } from "@/server/sample";

export const dynamic = "force-dynamic";

/** Adds a generated demo song to the library and a demo instructor share. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const withShare = body?.share === true;
  const { buffer, duration } = generateSampleWav();
  const key = `${randomUUID()}.wav`;
  await saveFile(key, buffer);

  const song: SongDoc = {
    id: randomUUID(),
    title: withShare ? "Amazing Grace – SATB Warm-up" : "Sample – Four-part Warm-up",
    kind: "audio",
    origin: withShare ? "shared" : "library",
    mimeType: "audio/wav",
    fileName: "sample-warmup.wav",
    storageKey: key,
    size: buffer.length,
    duration,
    playCount: 0,
    lastPlayedAt: null,
    createdAt: new Date(),
  };
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  await songs.insertOne(song);

  if (withShare) {
    const share: SharedMaterialDoc = {
      id: randomUUID(),
      songId: song.id,
      title: song.title,
      instructor: "Ms. Eleanor Hayes",
      notes:
        "Focus on the entrance at the second phrase and keep the vowels tall. Loop the last four bars at 0.75x until the harmony feels comfortable, then bring it up to full speed.",
      createdAt: new Date(),
    };
    const shared = await collection<SharedMaterialDoc>(COLLECTIONS.sharedMaterials);
    await shared.insertOne(share);
  }
  return Response.json(pub(song), { status: 201 });
}