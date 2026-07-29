import { getKpiMetricsAction, getSystemInsightsAction } from "@/actions/intelligence";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [kpiRes, insightsRes] = await Promise.all([
    getKpiMetricsAction(),
    getSystemInsightsAction(),
  ]);

  const kpis = kpiRes.data || null;
  const insights = insightsRes.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Executive Analytics & Intelligence Platform
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-module analytics, role-specific executive consoles (President, Treasurer, Faculty), and automated actionable recommendations
        </p>
      </div>

      <AnalyticsClient initialKpis={kpis} initialInsights={insights} />
    </div>
  );
}
