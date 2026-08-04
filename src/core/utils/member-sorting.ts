/**
 * Utility for sorting members in ascending Club Membership ID order.
 * Sorts by the numeric portion of the Club Membership ID (e.g. SAC-RC-0001, SAC-RC-0002, ..., SAC-RC-0050, SAC-RC-0051).
 */

export function compareMembersByClubMembershipId<
  T extends {
    clubMembershipId?: string | null;
    memberId?: string | null;
    membershipId?: string | null;
    id?: string | null;
  }
>(a: T, b: T): number {
  const parseId = (item: T) => {
    const idStr = (item.clubMembershipId || item.memberId || item.membershipId || item.id || "").trim();
    // Extract numeric portion (e.g. "SAC-RC-0051" -> 51)
    const match = idStr.match(/(\d+)/);
    const num = match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
    return { num, idStr };
  };

  const aVal = parseId(a);
  const bVal = parseId(b);

  if (aVal.num !== bVal.num) {
    return aVal.num - bVal.num;
  }
  return aVal.idStr.localeCompare(bVal.idStr, undefined, { numeric: true, sensitivity: "base" });
}

export function sortMembersByClubMembershipId<
  T extends {
    clubMembershipId?: string | null;
    memberId?: string | null;
    membershipId?: string | null;
    id?: string | null;
  }
>(membersList: T[]): T[] {
  if (!membersList || membersList.length === 0) return [];
  return [...membersList].sort(compareMembersByClubMembershipId);
}
