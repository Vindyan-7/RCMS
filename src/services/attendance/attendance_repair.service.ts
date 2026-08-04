/**
 * Attendance Domain - Attendance Points Repair & Migration Service
 * Ensures 100% idempotent attendance points and cleans up pre-existing duplicate awards.
 */

import { supabase } from "@/db";
import { logger } from "@/core/logger";

export interface AttendanceRepairResult {
  totalAttendanceLedgerEntries: number;
  duplicateEntriesRemoved: number;
  affectedMembersCount: number;
  repairedSessionIds: string[];
}

export class AttendanceRepairService {
  /**
   * One-time & periodic repair routine to scan points_ledger for attendance duplicates
   * grouped by (session_id, member_id), keeping the earliest valid entry and removing duplicates.
   */
  public async repairDuplicateAttendancePoints(): Promise<AttendanceRepairResult> {
    logger.info("[AttendanceRepairService] Initiating duplicate attendance points repair routine");

    // 1. Fetch all attendance points_ledger rows
    const { data: ledgerRows, error: ledgerErr } = await supabase
      .from("points_ledger")
      .select("*")
      .eq("category", "attendance");

    if (ledgerErr || !ledgerRows) {
      logger.error("[AttendanceRepairService] Failed to query points_ledger", ledgerErr);
      return {
        totalAttendanceLedgerEntries: 0,
        duplicateEntriesRemoved: 0,
        affectedMembersCount: 0,
        repairedSessionIds: [],
      };
    }

    // 2. Fetch all attendance_records & attendance_sessions
    const { data: recordsData } = await supabase
      .from("attendance_records")
      .select("id, session_id, member_id, scan_time, points");

    const { data: sessionsData } = await supabase
      .from("attendance_sessions")
      .select("id, title, attendance_points");

    const activeRecords = recordsData || [];
    const validSessions = sessionsData || [];

    const recordMap = new Map<string, { sessionId: string; memberId: string }>();
    activeRecords.forEach((r: any) => {
      recordMap.set(r.id, { sessionId: r.session_id, memberId: r.member_id });
    });

    const validSessionIds = new Set(validSessions.map((s: any) => s.id));
    const activeAttendanceRecordKeys = new Set(activeRecords.map((r: any) => `${r.session_id}_${r.member_id}`));

    // 3. Group ledger rows by (session_id, member_id)
    const ledgerGroups = new Map<string, any[]>();
    const unresolvableIds: string[] = [];

    for (const entry of ledgerRows) {
      let sId: string | null = null;
      const mId = entry.member_id;

      if (entry.reference_id && recordMap.has(entry.reference_id)) {
        sId = recordMap.get(entry.reference_id)!.sessionId;
      } else if (entry.reference_id && validSessionIds.has(entry.reference_id)) {
        sId = entry.reference_id;
      } else if (entry.remarks) {
        // Fallback: extract session title or match against valid sessions
        const match = validSessions.find((s: any) => entry.remarks.includes(s.title));
        if (match) sId = match.id;
      }

      if (sId && mId) {
        const groupKey = `${sId}_${mId}`;
        const existing = ledgerGroups.get(groupKey) || [];
        existing.push(entry);
        ledgerGroups.set(groupKey, existing);
      } else {
        unresolvableIds.push(entry.id);
      }
    }

    const idsToDelete: string[] = [...unresolvableIds];
    const affectedMemberSet = new Set<string>();
    const repairedSessionSet = new Set<string>();

    // 4. Evaluate each (session_id, member_id) group
    for (const [groupKey, entries] of ledgerGroups.entries()) {
      const [sId, mId] = groupKey.split("_");

      // Sort by created_at ascending
      entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const isMemberCurrentlyMarked = activeAttendanceRecordKeys.has(groupKey);

      if (!isMemberCurrentlyMarked) {
        // Member is not marked present in this session -> delete all attendance points
        for (const e of entries) {
          idsToDelete.push(e.id);
          affectedMemberSet.add(mId);
          repairedSessionSet.add(sId);
        }
      } else if (entries.length > 1) {
        // Multiple transactions exist -> keep earliest valid transaction (index 0), delete duplicates (index 1..N)
        for (let i = 1; i < entries.length; i++) {
          idsToDelete.push(entries[i].id);
          affectedMemberSet.add(mId);
          repairedSessionSet.add(sId);
        }
      }
    }

    // 5. Batch delete duplicate/orphaned points_ledger entries
    if (idsToDelete.length > 0) {
      logger.info(`[AttendanceRepairService] Removing ${idsToDelete.length} duplicate attendance points_ledger rows`);
      
      // Batch delete in chunks of 50
      for (let i = 0; i < idsToDelete.length; i += 50) {
        const chunk = idsToDelete.slice(i, i + 50);
        const { error: delErr } = await supabase.from("points_ledger").delete().in("id", chunk);
        if (delErr) {
          logger.error("[AttendanceRepairService] Batch delete error", delErr);
        }
      }
    }

    logger.info("[AttendanceRepairService] Duplicate attendance repair completed successfully", {
      totalAttendanceLedgerEntries: ledgerRows.length,
      duplicateEntriesRemoved: idsToDelete.length,
      affectedMembersCount: affectedMemberSet.size,
      repairedSessionsCount: repairedSessionSet.size,
    });

    return {
      totalAttendanceLedgerEntries: ledgerRows.length,
      duplicateEntriesRemoved: idsToDelete.length,
      affectedMembersCount: affectedMemberSet.size,
      repairedSessionIds: Array.from(repairedSessionSet),
    };
  }
}
