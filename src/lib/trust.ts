import { db } from "@/lib/db";

/**
 * Recalculate a user's trust score (0-100) based on:
 *   - Identity verifications:  +15 each (NIN, license, plate, selfie, phone, email) → max 60
 *   - Completed trips as driver: +1 each, max 15
 *   - Completed bookings as passenger: +1 each, max 10
 *   - 5-star reviews received: +1 each, max 10
 *   - Active safety incidents against: -10 each (severity weighted)
 *
 * Total possible: 60 + 15 + 10 + 10 = 95 base, minus penalties.
 * isVerified = true when NIN + SELFIE + PHONE are all APPROVED.
 */
export async function recalcTrustScore(userId: string): Promise<number> {
  const [verifications, tripsDriven, bookingsAsPassenger, reviewsReceived, incidents] =
    await Promise.all([
      db.verification.findMany({ where: { userId, status: "APPROVED" }, select: { type: true } }),
      db.trip.count({ where: { driverId: userId, status: "COMPLETED" } }),
      db.booking.count({ where: { passengerId: userId, status: "COMPLETED" } }),
      db.review.findMany({
        where: { revieweeId: userId },
        select: { rating: true },
      }),
      db.safetyIncident.findMany({
        where: { subjectId: userId, status: { in: ["REPORTED", "UNDER_REVIEW", "ACTIONED"] } },
        select: { severity: true },
      }),
    ]);

  const verifiedTypes = new Set(verifications.map((v) => v.type));
  const verificationScore = Math.min(60, verifications.length * 10);
  const driverScore = Math.min(15, tripsDriven);
  const passengerScore = Math.min(10, bookingsAsPassenger);
  const reviewScore = Math.min(10, reviewsReceived.filter((r) => r.rating === 5).length);
  const incidentPenalty = incidents.reduce((sum, i) => sum + i.severity * 5, 0);

  const score = Math.max(
    0,
    Math.min(100, verificationScore + driverScore + passengerScore + reviewScore - incidentPenalty),
  );

  const isVerified =
    verifiedTypes.has("NIN") &&
    verifiedTypes.has("SELFIE") &&
    verifiedTypes.has("PHONE");

  await db.user.update({
    where: { id: userId },
    data: {
      trustScore: score,
      isVerified,
    },
  });

  return score;
}
