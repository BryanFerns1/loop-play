import { collection, COLLECTIONS } from "@/db";
import type { SharedMaterialDoc, SongDoc } from "@/db/schema";
import { removeFile } from "@/server/storage";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un-share: removes the share. If the underlying file was uploaded only for sharing it is deleted too. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const shared = await collection<SharedMaterialDoc>(COLLECTIONS.sharedMaterials);
  const row = await shared.findOneAndDelete({ id });
  if (row) {
    const songs = await collection<SongDoc>(COLLECTIONS.songs);
    const song = await songs.findOne({ id: row.songId });
    if (song && song.origin === "shared") {
      await songs.deleteOne({ id: song.id });
      await removeFile(song.storageKey);
    }
  }
  return Response.json({ ok: true });
}