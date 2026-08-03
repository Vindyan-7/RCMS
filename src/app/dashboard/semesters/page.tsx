import { getSemesterDashboardDataAction } from "@/actions/members/semesters.actions";
import { SemesterLifecycleClient } from "@/components/semesters/semester-lifecycle-client";

export const dynamic = "force-dynamic";

export default async function SemestersPage() {
  const dashboardRes = await getSemesterDashboardDataAction();

  const semesters = dashboardRes.data?.semesters || [];
  const members = dashboardRes.data?.members || [];
  const academicYears = dashboardRes.data?.academicYears || [];
  const initialActiveMemberships = dashboardRes.data?.activeMemberships || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Semester &amp; Membership Lifecycle
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage academic semesters, renew member enrollments, and view membership history — Member IDs never change
        </p>
      </div>

      <SemesterLifecycleClient
        initialSemesters={semesters}
        initialMembers={members}
        academicYears={academicYears}
        initialActiveMemberships={initialActiveMemberships}
      />
    </div>
  );
}
