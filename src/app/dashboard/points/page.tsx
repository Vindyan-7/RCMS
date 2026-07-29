import { getLeaderboardAction } from "@/actions/points";
import { PointsClient } from "@/components/points/points-client";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  const leaderboardRes = await getLeaderboardAction();
  const leaderboardItems = leaderboardRes.data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Points Engine & Gamification Platform
        </h1>
        <p className="text-sm text-muted-foreground">
          Authoritative scoring engine, immutable points ledger, achievement tiers & member leaderboard rankings
        </p>
      </div>

      <PointsClient initialLeaderboard={leaderboardItems} />
    </div>
  );
}
