import { db, collections as firebaseCollections } from "./firebase";
import { FieldValue } from "firebase-admin/firestore";
import type {
  User,
  InsertUser,
  Admin,
  InsertAdmin,
  Visitor,
  InsertVisitor,
  Application,
  InsertApplication,
  UserOtp,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  trackVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorStats(startDate?: Date): Promise<{
    total: number;
    byCountry: Record<string, number>;
    byPage: Record<string, number>;
  }>;
  getActiveVisitors(): Promise<number>;
  
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

function getCollections() {
  if (!firebaseCollections) {
    throw new Error("Firebase not initialized. Please check your credentials.");
  }
  return firebaseCollections;
}

export class FirebaseStorage implements IStorage {
  private get collections() {
    return getCollections();
  }

  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.collections.users.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.collections.users
      .where("username", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const userData = {
      ...insertUser,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await this.collections.users.add(userData);
    return { id: docRef.id, ...userData } as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const docRef = this.collections.users.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;
    
    await docRef.update({ ...updates, updatedAt: new Date() });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as User;
  }

  async getAdmin(id: string): Promise<Admin | undefined> {
    const doc = await this.collections.admins.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Admin;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const snapshot = await this.collections.admins
      .where("username", "==", username)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Admin;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const now = new Date();
    const adminData = {
      ...insertAdmin,
      createdAt: now,
    };
    const docRef = await this.collections.admins.add(adminData);
    return { id: docRef.id, ...adminData } as Admin;
  }

  async trackVisitor(insertVisitor: InsertVisitor): Promise<Visitor> {
    const now = new Date();
    const visitorData = {
      ...insertVisitor,
      visitedAt: now,
    };
    const docRef = await this.collections.visitors.add(visitorData);
    return { id: docRef.id, ...visitorData } as Visitor;
  }

  async getVisitorStats(startDate?: Date) {
    let query = this.collections.visitors.orderBy("visitedAt", "desc");
    if (startDate) {
      query = this.collections.visitors
        .where("visitedAt", ">=", startDate)
        .orderBy("visitedAt", "desc");
    }

    const snapshot = await query.get();
    const byCountry: Record<string, number> = {};
    const byPage: Record<string, number> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.country) {
        byCountry[data.country] = (byCountry[data.country] || 0) + 1;
      }
      if (data.page) {
        byPage[data.page] = (byPage[data.page] || 0) + 1;
      }
    });

    return {
      total: snapshot.size,
      byCountry,
      byPage,
    };
  }

  async getActiveVisitors(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const snapshot = await this.collections.visitors
      .where("visitedAt", ">=", fiveMinutesAgo)
      .get();
    return snapshot.size;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const now = new Date();
    const appData = {
      ...insertApplication,
      submittedAt: now,
      reviewedAt: null,
    };
    const docRef = await this.collections.applications.add(appData);
    return { id: docRef.id, ...appData } as Application;
  }

  async getApplications(limit: number = 50): Promise<Application[]> {
    const snapshot = await this.collections.applications
      .orderBy("submittedAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Application));
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const doc = await this.collections.applications.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Application;
  }

  async updateApplicationStatus(
    id: string,
    status: string,
    reviewedBy?: string
  ): Promise<Application | undefined> {
    const docRef = this.collections.applications.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    await docRef.update({
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewedBy || null,
    });

    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Application;
  }

  async getApplicationStats() {
    const snapshot = await this.collections.applications.get();
    const stats = {
      total: 0,
      pending: 0,
      completed: 0,
      review: 0,
      rejected: 0,
    };

    snapshot.docs.forEach((doc) => {
      stats.total++;
      const status = doc.data().status;
      if (status === "pending") stats.pending++;
      else if (status === "completed") stats.completed++;
      else if (status === "review") stats.review++;
      else if (status === "rejected") stats.rejected++;
    });

    return stats;
  }

  async createOtp(email: string, hashedCode: string, expiresAt: Date): Promise<UserOtp> {
    const existing = await this.collections.otps.where("email", "==", email).get();
    const batch = db.batch();
    existing.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    const now = new Date();
    const otpData = {
      email,
      code: hashedCode,
      purpose: "registration",
      attempts: 0,
      expiresAt,
      verifiedAt: null,
      createdAt: now,
    };
    const docRef = await this.collections.otps.add(otpData);
    return { id: docRef.id, ...otpData } as UserOtp;
  }

  async getOtpByEmail(email: string): Promise<UserOtp | undefined> {
    const snapshot = await this.collections.otps
      .where("email", "==", email)
      .limit(1)
      .get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as UserOtp;
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await this.collections.otps.doc(id).update({
      attempts: FieldValue.increment(1),
    });
  }

  async markOtpVerified(id: string): Promise<void> {
    await this.collections.otps.doc(id).update({
      verifiedAt: new Date(),
    });
  }

  async deleteExpiredOtps(): Promise<void> {
    const now = new Date();
    const expired = await this.collections.otps.where("expiresAt", "<", now).get();
    const batch = db.batch();
    expired.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async updateOnlineSession(sessionId: string, userId?: string, page?: string): Promise<void> {
    const snapshot = await this.collections.onlineSessions
      .where("sessionId", "==", sessionId)
      .limit(1)
      .get();

    const now = new Date();
    if (snapshot.empty) {
      await this.collections.onlineSessions.add({
        sessionId,
        userId: userId || null,
        page: page || null,
        lastSeenAt: now,
        createdAt: now,
      });
    } else {
      await snapshot.docs[0].ref.update({
        lastSeenAt: now,
        page: page || null,
        userId: userId || null,
      });
    }
  }

  async getOnlineCount(): Promise<number> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const snapshot = await this.collections.onlineSessions
      .where("lastSeenAt", ">=", twoMinutesAgo)
      .get();
    return snapshot.size;
  }

  async cleanupOldSessions(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const old = await this.collections.onlineSessions
      .where("lastSeenAt", "<", tenMinutesAgo)
      .get();
    const batch = db.batch();
    old.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async getRecentVisitors(limit: number = 50): Promise<Visitor[]> {
    const snapshot = await this.collections.visitors
      .orderBy("visitedAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Visitor));
  }

  async getUsers(limit: number = 50): Promise<User[]> {
    const snapshot = await this.collections.users
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

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

    const paidUsers = users.filter((u) => u.paymentStatus === "paid").length;

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

  async getUserWithApplicationData(userId: string): Promise<(User & { applicationId?: string; applicationStatus?: string; submittedAt?: Date }) | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const snapshot = await this.collections.applications
      .where("userId", "==", userId)
      .orderBy("submittedAt", "desc")
      .limit(1)
      .get();

    const app = snapshot.empty ? undefined : snapshot.docs[0];
    return {
      ...user,
      applicationId: app?.id,
      applicationStatus: app?.data()?.status,
      submittedAt: app?.data()?.submittedAt,
    };
  }
}

export const storage = new FirebaseStorage();
