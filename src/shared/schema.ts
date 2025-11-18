/**
 * Frontend Validation Schemas
 *
 * This file contains all Zod validation schemas used by the frontend.
 * These are standalone schemas (no Drizzle dependency) for form validation.
 *
 * Usage:
 *   import { signupUserSchema, loginUserSchema } from "@shared/schemas"
 */

import { z } from "zod";

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const signupUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// ============================================
// FORUM SCHEMAS
// ============================================

export const insertForumThreadSchema = z.object({
  title: z
    .string()
    .min(4, "Title must be at least 4 characters")
    .max(140, "Title must be less than 140 characters"),
  body: z
    .string()
    .min(10, "Thread content must be at least 10 characters")
    .max(20000, "Thread content must be less than 20,000 characters"),
});

export const insertForumPostSchema = z.object({
  body: z
    .string()
    .min(10, "Reply must be at least 10 characters")
    .max(20000, "Reply must be less than 20,000 characters"),
});

// ============================================
// ICA INTERVIEW TRANSCRIPT SCHEMAS
// ============================================

export const insertIcaInterviewTranscriptSchema = z.object({
  userId: z.number().int("User ID must be an integer"),
  title: z.string().min(1, "Title is required"),
  customerName: z.string().nullable().optional(),
  interviewDate: z.string().datetime().nullable().optional(),
  platform: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  rawTranscript: z.string().min(1, "Raw transcript is required"),
  extractedInsights: z.any().nullable().optional(), // JSONB can be any JSON structure
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z
    .enum(["draft", "processing", "processed", "updated"])
    .default("draft")
    .optional(),
});

export const icaInterviewTranscriptSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  customerName: z.string().nullable().optional(),
  interviewDate: z.string().datetime().nullable().optional(),
  platform: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  rawTranscript: z.string(),
  extractedInsights: z.any().nullable().optional(), // JSONB can be any JSON structure
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["draft", "processing", "processed", "updated"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================
// USER PROGRESS SCHEMAS
// ============================================

export const insertUserProgressSchema = z.object({
  userId: z.number().int("User ID must be an integer"),
  stepNumber: z.number().int("Step number must be an integer"),
  completedPrompts: z.any().nullable().optional(), // JSONB can be any JSON structure
  brandVoice: z.string().nullable().optional(),
  customerAvatar: z.any().nullable().optional(), // JSONB can be any JSON structure
  isCompleted: z.boolean().default(false),
  completedAt: z.string().datetime().nullable().optional(),
});

export const userProgressSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  stepNumber: z.number().int(),
  completedPrompts: z.any().nullable().optional(), // JSONB can be any JSON structure
  brandVoice: z.string().nullable().optional(),
  customerAvatar: z.any().nullable().optional(), // JSONB can be any JSON structure
  isCompleted: z.boolean(),
  completedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserSchema = z.object({
  id: z.number().int().optional(), // serial primary key, usually auto-generated
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  businessName: z.string().nullable().optional(),
  aboutMe: z.string().nullable().optional(),
  stripeCustomerId: z.string().nullable().optional(),
  stripeSubscriptionId: z.string().nullable().optional(),
  subscriptionStatus: z
    .enum(["active", "canceled", "past_due"])
    .nullable()
    .optional(),
  hasCompletedOnboarding: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  lastLoginAt: z.string().datetime().nullable().optional(),
  lastVisitedPath: z.string().max(500).nullable().optional(),
  lastVisitedSection: z.string().max(255).nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// ============================================
// TYPE INFERENCES (for TypeScript)
// ============================================

export type SignupUser = z.infer<typeof signupUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type InsertIcaInterviewTranscript = z.infer<
  typeof insertIcaInterviewTranscriptSchema
>;
export type IcaInterviewTranscript = z.infer<
  typeof icaInterviewTranscriptSchema
>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = z.infer<typeof userProgressSchema>;
export type User = z.infer<typeof UserSchema>;
