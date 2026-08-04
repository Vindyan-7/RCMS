import { getAnalyticsDashboardAction } from "@/actions/intelligence/intelligence.actions";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const res = await getAnalyticsDashboardAction();
  const analyticsData = res.data || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          RCMS Command Center — Executive Analytics 2.0
        </h1>
        <p className="text-sm text-muted-foreground">
          Single source of truth for Robotics Club operational health, membership growth, attendance metrics, points engine, and semester lifecycle.
        </p>
      </div>

      <AnalyticsClient initialAnalytics={analyticsData} />
    </div>
  );
}
