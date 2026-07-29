import { getAttendanceSessionsAction } from "@/actions/attendance/attendance_sessions.actions";
import { getAttendanceRecordsAction } from "@/actions/attendance/attendance_records.actions";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const [sessionsRes, recordsRes] = await Promise.all([
    getAttendanceSessionsAction(),
    getAttendanceRecordsAction(),
  ]);

  const sessions = sessionsRes.data?.items || [];
  const records = recordsRes.data?.items || [];

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

      <AttendanceClient initialSessions={sessions} initialRecords={records} />
    </div>
  );
}
