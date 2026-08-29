import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET() {
  try {
    const offices = await db.office.findMany({
      select: { id: true, name: true, short_code: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(offices);
  } catch (e) {
    console.error("[/api/offices]", e);
    return NextResponse.json([], { status: 500 });
  }
}
