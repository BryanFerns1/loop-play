import { Readable } from "node:stream";
import { collection, COLLECTIONS } from "@/db";
import type { SongDoc } from "@/db/schema";
import { fileSize, readRange } from "@/server/storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Streams the media file with HTTP Range support so seeking/looping is instant. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const songs = await collection<SongDoc>(COLLECTIONS.songs);
  const song = await songs.findOne({ id });
  if (!song) return new Response("Not found", { status: 404 });
  const size = await fileSize(song.storageKey);
  if (size === null) return new Response("File missing", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": song.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  const range = req.headers.get("range");
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      if (m[1] === "" && m[2] !== "") {
        start = Math.max(0, size - Number(m[2]));
      } else {
        start = m[1] ? Number(m[1]) : 0;
        if (m[2]) end = Math.min(Number(m[2]), size - 1);
      }
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
  }
  headers["Content-Length"] = String(end - start + 1);
  const stream = Readable.toWeb(readRange(song.storageKey, start, end)) as unknown as ReadableStream;
  return new Response(stream, { status, headers });
}