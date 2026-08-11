import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const [transactions, fresh] = await Promise.all([
      db.walletTransaction.findMany({
        where: { userId: user.id },
        include: {
          booking: {
            select: {
              id: true,
              trip: {
                select: {
                  originLabel: true,
                  destinationLabel: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.user.findUnique({
        where: { id: user.id },
        select: { walletBalance: true },
      }),
    ]);

    return NextResponse.json({
      balance: fresh?.walletBalance ?? 0,
      transactions,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[wallet GET]", err);
    return NextResponse.json(
      { error: "Failed to load wallet" },
      { status: 500 },
    );
  }
}
