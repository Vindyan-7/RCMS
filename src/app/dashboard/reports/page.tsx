import { getReportCenterDataAction } from "@/actions/reports/reports.actions";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata = {
  title: "Reports Center | RCMS Command Center",
  description: "Centralized workspace to generate, preview, export and archive robotics club reports.",
};

export default async function ReportsPage() {
  const res = await getReportCenterDataAction();
  const initialData = res.success && res.data ? res.data : null;

  return (
    <div className="space-y-6">
      <ReportsClient initialData={initialData} />
    </div>
  );
}
