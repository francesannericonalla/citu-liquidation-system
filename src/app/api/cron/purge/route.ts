import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

// Called by the GitHub Actions cron job with the CRON_SECRET header.
// Permanently deletes liquidations that were soft-deleted more than 30 days ago.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const result = await db.liquidation.deleteMany({
    where: {
      deleted_at: { not: null, lte: cutoff },
    },
  });

  return NextResponse.json({ purged: result.count });
}
