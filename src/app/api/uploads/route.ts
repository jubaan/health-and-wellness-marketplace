import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: { code: "bad_request", message: "file_required" } }, { status: 400 });
  }
  const arrayBuffer = await (file as File).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname((file as File).name) || ".bin";
  const id = crypto.randomBytes(16).toString("hex");
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${id}${ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);
  return NextResponse.json({ url: `/uploads/${filename}` });
}

