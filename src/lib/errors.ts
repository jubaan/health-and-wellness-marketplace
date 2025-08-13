import { NextResponse } from "next/server";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const unauthorized = (msg = "Unauthorized") => jsonError(401, "unauthorized", msg);
export const forbidden = (msg = "Forbidden") => jsonError(403, "forbidden", msg);
export const notFound = (msg = "Not found") => jsonError(404, "not_found", msg);
export const badRequest = (msg = "Bad request") => jsonError(400, "bad_request", msg);
export const conflict = (msg = "Conflict") => jsonError(409, "conflict", msg);

