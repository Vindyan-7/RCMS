/**
 * Club Settings & Rules Configurations
 */

import { PointsCategory } from "../enums";

export const clubConfig = Object.freeze({
  clubCode: "SAC-RC",
  
  membershipDefaults: {
    initialStatus: "active" as const,
    requiresRenewalEveryYear: true,
  },

  pointsDefaults: {
    [PointsCategory.ATTENDANCE]: 10,
    [PointsCategory.TASK]: 20,
    [PointsCategory.EVENT]: 30,
    [PointsCategory.BONUS]: 5,
    [PointsCategory.ADJUSTMENT]: 0,
    
    // Penalty configurations
    lateAttendancePenaltyMultiplier: 0.5, // e.g. 50% points for late arrival
  },

  eventDefaults: {
    allowOverlappingEvents: false,
    requireParticipationVerification: true,
  },

  inventoryDefaults: {
    maxBorrowDurationDays: 14,
    defaultConditionOnIssue: "good" as const,
  },
});

export type ClubConfig = typeof clubConfig;
