import { getAttendanceDashboardInitialDataAction } from "@/actions/attendance/attendance_sessions.actions";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const initRes = await getAttendanceDashboardInitialDataAction();
  const initialData = initRes.data || {
    sessions: [],
    archivedSessions: [],
    records: [],
    semesterContext: null,
    enrolledMembers: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Attendance Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Academic year attendance tracking, secure volunteer scanner authentication, and points dispatches
        </p>
      </div>

      <AttendanceClient
        initialSessions={initialData.sessions}
        initialRecords={initialData.records}
        initialArchivedSessions={initialData.archivedSessions}
        initialSemesterContext={initialData.semesterContext}
        initialEnrolledMembers={initialData.enrolledMembers}
      />
    </div>
  );
}
