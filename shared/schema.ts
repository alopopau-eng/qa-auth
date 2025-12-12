import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for registered users going through the registration flow
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullNameArabic: text("full_name_arabic"),
  fullNameEnglish: text("full_name_english"),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  nationality: text("nationality"),
  address: jsonb("address").$type<{
    buildingNumber?: string;
    area?: string;
    street?: string;
  }>(),
  accountType: text("account_type").default("citizen"), // citizen or visitor
  registrationStatus: text("registration_status").default("pending"), // pending, completed, rejected
  paymentStatus: text("payment_status").default("pending"), // pending, paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Admin users table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Visitor tracking table
export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),
  page: text("page").notNull(),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  visitedAt: timestamp("visited_at").notNull().defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  visitedAt: true,
});

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitors.$inferSelect;

// Application submissions for inbox
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  applicationType: text("application_type").notNull(), // "New Registration", "Payment Verification", etc.
  status: text("status").notNull().default("pending"), // pending, completed, review, rejected
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => admins.id),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// OTP verification table
export const userOtps = pgTable("user_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(), // hashed OTP code
  purpose: text("purpose").notNull().default("registration"), // registration, password_reset
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOtpSchema = createInsertSchema(userOtps).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type UserOtp = typeof userOtps.$inferSelect;

// Online sessions for tracking active users
export const onlineSessions = pgTable("online_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  userId: varchar("user_id"),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  page: text("page"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OnlineSession = typeof onlineSessions.$inferSelect;
