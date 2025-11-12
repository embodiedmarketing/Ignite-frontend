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
export type User = z.infer<typeof UserSchema>;
