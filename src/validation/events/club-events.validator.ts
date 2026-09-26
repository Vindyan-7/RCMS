/**
 * Events Domain - Club Events Validator
 * Validates inputs for competition registration, submissions, voting, and configuration.
 */

import { z } from "zod";
import { uuidSchema } from "@/core/validation";

export const memberLookupSchema = z.object({
  eventId: uuidSchema,
  membershipId: z.string().trim().min(2, "Membership ID or Roll Number must be at least 2 characters"),
});

export const registerMemberParticipantSchema = z.object({
  eventId: uuidSchema,
  memberId: uuidSchema,
});

export const registerFresherParticipantSchema = z.object({
  eventId: uuidSchema,
  fullName: z
    .string()
    .trim()
    .min(2, "Full Name must be at least 2 characters")
    .max(100, "Full Name cannot exceed 100 characters"),
  mobileNumber: z
    .string()
    .trim()
    .min(10, "Please enter a valid 10-digit mobile number"),
});

export const submissionImageItemSchema = z.object({
  imageUrl: z.string().url("Valid image URL is required"),
  storagePath: z.string().min(1, "Storage path is required"),
  fileSizeBytes: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const submitProjectSchema = z.object({
  eventId: uuidSchema,
  participantId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(2, "Project title must be at least 2 characters")
    .max(150, "Project title cannot exceed 150 characters"),
  description: z.string().trim().min(1, "Project description is required"),
  images: z
    .array(submissionImageItemSchema)
    .min(1, "At least one project image is required"),
});

export const castVoteSchema = z.object({
  eventId: uuidSchema,
  participantId: uuidSchema,
  submissionId: uuidSchema,
});

export const removeVoteSchema = z.object({
  eventId: uuidSchema,
  participantId: uuidSchema,
  submissionId: uuidSchema,
});

export const updateSubmissionStatusSchema = z.object({
  submissionId: uuidSchema,
  status: z.enum(["draft", "submitted", "published", "rejected", "hidden"]),
  adminFeedback: z.string().optional(),
});

export const createEventConfigSchema = z.object({
  name: z.string().trim().min(2, "Event name must be at least 2 characters").max(100),
  description: z.string().trim().optional(),
  venue: z.string().trim().optional(),
  points: z.number().int().min(0).default(35),
  coverImageUrl: z.string().nullable().optional(),
  submissionStartAt: z.coerce.date().nullable().optional(),
  submissionEndAt: z.coerce.date().nullable().optional(),
  minImages: z.number().int().min(1).max(5).default(1),
  maxImages: z.number().int().min(1).max(10).default(2),
  minDescriptionChars: z.number().int().min(10).max(1000).default(100),
  votingStartAt: z.coerce.date().nullable().optional(),
  votingEndAt: z.coerce.date().nullable().optional(),
  votesPerParticipant: z.number().int().min(1).max(10).default(1),
  selfVotingAllowed: z.boolean().default(false),
  showVoteCounts: z.boolean().default(false),
  numberOfWinners: z.number().int().min(1).max(10).default(1),
  submissionPoints: z.number().int().min(0).default(100),
  votingPercentage: z.number().int().min(0).max(100).default(40),
});

export const updateEventConfigSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  submissionStartAt: z.coerce.date().nullable().optional(),
  submissionEndAt: z.coerce.date().nullable().optional(),
  minImages: z.number().int().min(1).max(5).optional(),
  maxImages: z.number().int().min(1).max(10).optional(),
  minDescriptionChars: z.number().int().min(10).max(1000).optional(),
  votingState: z.enum(["NOT_STARTED", "ACTIVE", "PAUSED", "CLOSED"]).optional(),
  votingStartAt: z.coerce.date().nullable().optional(),
  votingEndAt: z.coerce.date().nullable().optional(),
  votesPerParticipant: z.number().int().min(1).max(10).optional(),
  selfVotingAllowed: z.boolean().optional(),
  showVoteCounts: z.boolean().optional(),
  numberOfWinners: z.number().int().min(1).max(10).optional(),
  coverImageUrl: z.string().nullable().optional(),
  submissionPoints: z.number().int().min(0).optional(),
  votingPercentage: z.number().int().min(0).max(100).optional(),
});

export type MemberLookupInput = z.infer<typeof memberLookupSchema>;
export type RegisterMemberParticipantInput = z.infer<typeof registerMemberParticipantSchema>;
export type RegisterFresherParticipantInput = z.infer<typeof registerFresherParticipantSchema>;
export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type RemoveVoteInput = z.infer<typeof removeVoteSchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
export type CreateEventConfigInput = z.infer<typeof createEventConfigSchema>;
export type UpdateEventConfigInput = z.infer<typeof updateEventConfigSchema>;

export class ClubEventsValidator {
  public static async validateMemberLookup(data: unknown): Promise<MemberLookupInput> {
    return memberLookupSchema.parseAsync(data);
  }

  public static async validateRegisterMember(data: unknown): Promise<RegisterMemberParticipantInput> {
    return registerMemberParticipantSchema.parseAsync(data);
  }

  public static async validateRegisterFresher(data: unknown): Promise<RegisterFresherParticipantInput> {
    return registerFresherParticipantSchema.parseAsync(data);
  }

  public static async validateSubmitProject(data: unknown): Promise<SubmitProjectInput> {
    return submitProjectSchema.parseAsync(data);
  }

  public static async validateCastVote(data: unknown): Promise<CastVoteInput> {
    return castVoteSchema.parseAsync(data);
  }

  public static async validateRemoveVote(data: unknown): Promise<RemoveVoteInput> {
    return removeVoteSchema.parseAsync(data);
  }

  public static async validateUpdateSubmissionStatus(data: unknown): Promise<UpdateSubmissionStatusInput> {
    return updateSubmissionStatusSchema.parseAsync(data);
  }

  public static async validateCreateEventConfig(data: unknown): Promise<CreateEventConfigInput> {
    return createEventConfigSchema.parseAsync(data);
  }

  public static async validateUpdateEventConfig(data: unknown): Promise<UpdateEventConfigInput> {
    return updateEventConfigSchema.parseAsync(data);
  }
}
