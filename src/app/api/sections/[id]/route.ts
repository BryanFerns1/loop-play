import { collection, COLLECTIONS } from "@/db";
import { pub, type SectionDoc } from "@/db/schema";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const patch: Partial<SectionDoc> = { updatedAt: new Date() };
  if (typeof body.name === "string") {
    if (!body.name.trim()) return Response.json({ error: "Section name is required" }, { status: 400 });
    patch.name = body.name.trim().slice(0, 80);
  }
  if (body.startTime !== undefined) patch.startTime = Number(body.startTime);
  if (body.endTime !== undefined) patch.endTime = Number(body.endTime);
  const s = patch.startTime;
  const e = patch.endTime;
  if ((s !== undefined && (!Number.isFinite(s) || s < 0)) || (e !== undefined && !Number.isFinite(e))) {
    return Response.json({ error: "Invalid time" }, { status: 400 });
  }
  if (s !== undefined && e !== undefined && e <= s) {
    return Response.json({ error: "End must be after start" }, { status: 400 });
  }
  const sections = await collection<SectionDoc>(COLLECTIONS.sections);
  const row = await sections.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: "after" });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(pub(row));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const sections = await collection<SectionDoc>(COLLECTIONS.sections);
  await sections.deleteOne({ id });
  return Response.json({ ok: true });
}