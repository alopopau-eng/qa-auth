import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import {
  type User,
  type InsertUser,
  type Admin,
  type InsertAdmin,
  type Visitor,
  type InsertVisitor,
  type Application,
  type InsertApplication,
  type UserOtp,
  type OnlineSession,
} from "@shared/schema";
import { eq, desc, and, gte, sql as drizzleSql, count, lt } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Visitor tracking
  trackVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorStats(startDate?: Date): Promise<{
    total: number;
    byCountry: Record<string, number>;
    byPage: Record<string, number>;
  }>;
  getActiveVisitors(): Promise<number>;
  
  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplications(limit?: number): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | undefined>;
  updateApplicationStatus(
    id: string,
    status: string,
    reviewedBy?: string
  ): Promise<Application | undefined>;
  getApplicationStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    review: number;
    rejected: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.id, id));
    return admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.username, username));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(schema.admins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  // Visitor tracking
  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const [visitor] = await db
      .insert(schema.visitors)
      .values(insertVisitor)
      .returning();
    return visitor;
  }

  async getVisitorStats(startDate?: Date) {
    const where = startDate
      ? gte(schema.visitors.visitedAt, startDate)
      : undefined;

    const allVisitors = await db
      .select()
      .from(schema.visitors)
      .where(where);

    const byCountry: Record<string, number> = {};
    const byPage: Record<string, number> = {};

    allVisitors.forEach((visitor) => {
      if (visitor.country) {
        byCountry[visitor.country] = (byCountry[visitor.country] || 0) + 1;
      }
      byPage[visitor.page] = (byPage[visitor.page] || 0) + 1;
    });

    return {
      total: allVisitors.length,
      byCountry,
      byPage,
    };
  }

  async getActiveVisitors(): Promise<number> {
    // Consider visitors active if they visited in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await db
      .select({ count: count() })
      .from(schema.visitors)
      .where(gte(schema.visitors.visitedAt, fiveMinutesAgo));

    return result[0]?.count || 0;
  }

  // Applications
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(schema.applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getApplications(limit: number = 50): Promise<Application[]> {
    return await db
      .select()
      .from(schema.applications)
      .orderBy(desc(schema.applications.submittedAt))
      .limit(limit);
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, id));
    return application;
  }

  async updateApplicationStatus(
    id: string,
    status: string,
    reviewedBy?: string
  ): Promise<Application | undefined> {
    const [application] = await db
      .update(schema.applications)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy,
      })
      .where(eq(schema.applications.id, id))
      .returning();
    return application;
  }

  async getApplicationStats() {
    const all = await db.select().from(schema.applications);
    
    return {
      total: all.length,
      pending: all.filter((a) => a.status === "pending").length,
      completed: all.filter((a) => a.status === "completed").length,
      review: all.filter((a) => a.status === "review").length,
      rejected: all.filter((a) => a.status === "rejected").length,
    };
  }

  // OTP operations
  async createOtp(email: string, hashedCode: string, expiresAt: Date): Promise<UserOtp> {
    // Delete any existing OTP for this email first
    await db.delete(schema.userOtps).where(eq(schema.userOtps.email, email));
    
    const [otp] = await db
      .insert(schema.userOtps)
      .values({
        email,
        code: hashedCode,
        purpose: "registration",
        attempts: 0,
        expiresAt,
      })
      .returning();
    return otp;
  }

  async getOtpByEmail(email: string): Promise<UserOtp | undefined> {
    const [otp] = await db
      .select()
      .from(schema.userOtps)
      .where(eq(schema.userOtps.email, email));
    return otp;
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(schema.userOtps)
      .set({ attempts: drizzleSql`attempts + 1` })
      .where(eq(schema.userOtps.id, id));
  }

  async markOtpVerified(id: string): Promise<void> {
    await db
      .update(schema.userOtps)
      .set({ verifiedAt: new Date() })
      .where(eq(schema.userOtps.id, id));
  }

  async deleteExpiredOtps(): Promise<void> {
    await db
      .delete(schema.userOtps)
      .where(lt(schema.userOtps.expiresAt, new Date()));
  }

  // Online session operations
  async updateOnlineSession(sessionId: string, userId?: string, page?: string): Promise<void> {
    const existing = await db
      .select()
      .from(schema.onlineSessions)
      .where(eq(schema.onlineSessions.sessionId, sessionId));

    if (existing.length > 0) {
      await db
        .update(schema.onlineSessions)
        .set({ lastSeenAt: new Date(), page, userId })
        .where(eq(schema.onlineSessions.sessionId, sessionId));
    } else {
      await db
        .insert(schema.onlineSessions)
        .values({ sessionId, userId, page, lastSeenAt: new Date() });
    }
  }

  async getOnlineCount(): Promise<number> {
    // Users active in the last 2 minutes are considered online
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    const result = await db
      .select({ count: count() })
      .from(schema.onlineSessions)
      .where(gte(schema.onlineSessions.lastSeenAt, twoMinutesAgo));

    return result[0]?.count || 0;
  }

  async cleanupOldSessions(): Promise<void> {
    // Remove sessions older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await db
      .delete(schema.onlineSessions)
      .where(lt(schema.onlineSessions.lastSeenAt, tenMinutesAgo));
  }

  // Get recent visitors for inbox display
  async getRecentVisitors(limit: number = 50): Promise<Visitor[]> {
    return await db
      .select()
      .from(schema.visitors)
      .orderBy(desc(schema.visitors.visitedAt))
      .limit(limit);
  }

  // Get all users with their details
  async getUsers(limit: number = 50): Promise<User[]> {
    return await db
      .select()
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit);
  }

  // Get inbox data combining users and applications
  async getInboxData(): Promise<{
    users: User[];
    applications: Application[];
    visitors: Visitor[];
    stats: { total: number; data: number; visitors: number; cards: number };
  }> {
    const [users, applications, visitors] = await Promise.all([
      this.getUsers(100),
      this.getApplications(100),
      this.getRecentVisitors(100),
    ]);

    const paidUsers = users.filter(u => u.paymentStatus === "paid").length;

    return {
      users,
      applications,
      visitors,
      stats: {
        total: users.length + visitors.length,
        data: users.length,
        visitors: visitors.length,
        cards: paidUsers,
      },
    };
  }

  // Get complete user registration form data
  async getUserWithApplicationData(userId: string): Promise<(User & { applicationId?: string; applicationStatus?: string; submittedAt?: Date }) | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const applications = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.userId, userId))
      .orderBy(desc(schema.applications.submittedAt))
      .limit(1);

    const app = applications[0];
    return {
      ...user,
      applicationId: app?.id,
      applicationStatus: app?.status,
      submittedAt: app?.submittedAt,
    };
  }
}

export const storage = new DatabaseStorage();
