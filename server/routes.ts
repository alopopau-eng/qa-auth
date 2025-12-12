import type { Express, Request } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertApplicationSchema, insertVisitorSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { WebSocketServer, WebSocket } from "ws";

// Extend Express session
declare module "express-session" {
  interface SessionData {
    userId?: string;
    adminId?: string;
    otpVerified?: boolean;
    pendingEmail?: string;
  }
}

// Store for rate limiting
const otpRateLimit: Map<string, { count: number; resetTime: number }> = new Map();

// WebSocket clients
let wss: WebSocketServer | null = null;

// Broadcast function for real-time updates
function broadcast(type: string, data: any) {
  if (wss) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============= WEBSOCKET SETUP =============
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    // Send initial stats on connection
    (async () => {
      try {
        const onlineCount = await storage.getOnlineCount();
        const appStats = await storage.getApplicationStats();
        ws.send(JSON.stringify({
          type: "initial_stats",
          data: { onlineCount, applications: appStats.total }
        }));
      } catch (e) {
        console.error("Error sending initial stats:", e);
      }
    })();
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  
  // Periodic cleanup and broadcast
  setInterval(async () => {
    try {
      await storage.cleanupOldSessions();
      await storage.deleteExpiredOtps();
      
      // Broadcast online count
      const onlineCount = await storage.getOnlineCount();
      broadcast("online_count", { count: onlineCount });
    } catch (e) {
      console.error("Periodic cleanup error:", e);
    }
  }, 30000); // Every 30 seconds
  
  // ============= OTP ROUTES =============
  
  // Request OTP for email verification
  app.post("/api/auth/otp/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
      }
      
      // Rate limiting: max 3 requests per 5 minutes
      const now = Date.now();
      const limit = otpRateLimit.get(email);
      if (limit && limit.resetTime > now && limit.count >= 3) {
        return res.status(429).json({ 
          error: "تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة بعد 5 دقائق" 
        });
      }
      
      // Generate OTP
      const otpCode = generateOtp();
      const hashedCode = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      // Store OTP
      await storage.createOtp(email, hashedCode, expiresAt);
      
      // Update rate limit
      if (!limit || limit.resetTime <= now) {
        otpRateLimit.set(email, { count: 1, resetTime: now + 5 * 60 * 1000 });
      } else {
        limit.count++;
      }
      
      // Store email in session for verification
      req.session.pendingEmail = email;
      
      // In production, send OTP via email/SMS
      // For demo, we'll log it and return it
      console.log(`OTP for ${email}: ${otpCode}`);
      
      res.json({ 
        success: true, 
        message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        // Only for demo - remove in production
        _demoCode: otpCode
      });
    } catch (error: any) {
      console.error("OTP request error:", error);
      res.status(500).json({ error: "فشل في إرسال رمز التحقق" });
    }
  });
  
  // Verify OTP
  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ error: "البريد الإلكتروني ورمز التحقق مطلوبان" });
      }
      
      const otp = await storage.getOtpByEmail(email);
      
      if (!otp) {
        return res.status(400).json({ error: "رمز التحقق غير صالح أو منتهي الصلاحية" });
      }
      
      // Check if expired
      if (otp.expiresAt < new Date()) {
        return res.status(400).json({ error: "انتهت صلاحية رمز التحقق" });
      }
      
      // Check attempts
      if (otp.attempts >= 5) {
        return res.status(400).json({ error: "تم تجاوز الحد الأقصى للمحاولات" });
      }
      
      // Verify code
      const isValid = await bcrypt.compare(code, otp.code);
      
      if (!isValid) {
        await storage.incrementOtpAttempts(otp.id);
        return res.status(400).json({ error: "رمز التحقق غير صحيح" });
      }
      
      // Mark as verified
      await storage.markOtpVerified(otp.id);
      req.session.otpVerified = true;
      
      res.json({ success: true, message: "تم التحقق بنجاح" });
    } catch (error: any) {
      console.error("OTP verify error:", error);
      res.status(500).json({ error: "فشل في التحقق من الرمز" });
    }
  });
  
  // ============= HEARTBEAT / ONLINE STATUS =============
  
  app.post("/api/heartbeat", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const { page } = req.body;
      const userId = req.session.userId;
      
      await storage.updateOnlineSession(sessionId, userId, page);
      
      const onlineCount = await storage.getOnlineCount();
      broadcast("online_count", { count: onlineCount });
      
      res.json({ success: true, onlineCount });
    } catch (error) {
      console.error("Heartbeat error:", error);
      res.status(500).json({ error: "Heartbeat failed" });
    }
  });
  
  // ============= AUTH ROUTES =============
  
  // User Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = req.body;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      
      // Create application entry for inbox
      const application = await storage.createApplication({
        userId: user.id,
        applicantName: data.fullNameEnglish || data.username,
        applicantEmail: data.email,
        applicationType: "New Registration",
        status: "pending",
      });
      
      // Broadcast new application to admin dashboard
      const appStats = await storage.getApplicationStats();
      broadcast("new_application", {
        application,
        totalApplications: appStats.total
      });
      
      res.json({ success: true, userId: user.id });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });
  
  // User Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Admin Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.adminId = admin.id;
      res.json({ success: true, admin: { id: admin.id, username: admin.username, role: admin.role } });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  
  // Get current user/admin
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          const { password, ...safeUser } = user;
          return res.json({ type: "user", data: safeUser });
        }
      }
      
      if (req.session.adminId) {
        const admin = await storage.getAdmin(req.session.adminId);
        if (admin) {
          const { password, ...safeAdmin } = admin;
          return res.json({ type: "admin", data: safeAdmin });
        }
      }
      
      res.status(401).json({ error: "Not authenticated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // ============= VISITOR TRACKING =============
  
  app.post("/api/visitors/track", async (req, res) => {
    try {
      const visitorData = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        country: req.body.country || "Qatar",
        page: req.body.page || "/",
        referrer: req.body.referrer,
        sessionId: req.sessionID,
      };
      
      await storage.trackVisitor(visitorData);
      res.json({ success: true });
    } catch (error) {
      console.error("Visitor tracking error:", error);
      res.status(500).json({ error: "Tracking failed" });
    }
  });
  
  // ============= ADMIN ROUTES =============
  
  // Middleware to check admin authentication
  const requireAdmin = (req: Request, res: any, next: any) => {
    if (!req.session.adminId) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };
  
  // Get dashboard stats
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const visitorStats = await storage.getVisitorStats(today);
      const activeVisitors = await storage.getActiveVisitors();
      const applicationStats = await storage.getApplicationStats();
      
      // Mock revenue calculation (QAR 10 per completed application)
      const revenue = applicationStats.completed * 10;
      
      res.json({
        totalVisitors: visitorStats.total,
        activeNow: activeVisitors,
        applications: applicationStats.total,
        revenue: revenue,
        visitorsByCountry: visitorStats.byCountry,
        applicationsByStatus: {
          pending: applicationStats.pending,
          completed: applicationStats.completed,
          review: applicationStats.review,
          rejected: applicationStats.rejected,
        },
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });
  
  // Get applications (inbox)
  app.get("/api/admin/applications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const applications = await storage.getApplications(limit);
      res.json(applications);
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ error: "Failed to get applications" });
    }
  });
  
  // Update application status
  app.patch("/api/admin/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateApplicationStatus(
        id,
        status,
        req.session.adminId
      );
      
      if (!updated) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({ error: "Failed to update application" });
    }
  });
  
  // Get visitor analytics
  app.get("/api/admin/visitors/analytics", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const stats = await storage.getVisitorStats(startDate);
      res.json(stats);
    } catch (error) {
      console.error("Visitor analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // Get inbox data (users, applications, visitors combined)
  app.get("/api/admin/inbox", async (req, res) => {
    try {
      const inboxData = await storage.getInboxData();
      res.json(inboxData);
    } catch (error) {
      console.error("Inbox data error:", error);
      res.status(500).json({ error: "Failed to get inbox data" });
    }
  });

  // Get user full form submission data
  app.get("/api/admin/users/:id/form", async (req, res) => {
    try {
      const { id } = req.params;
      const userData = await storage.getUserWithApplicationData(id);
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(userData);
    } catch (error) {
      console.error("Get user form data error:", error);
      res.status(500).json({ error: "Failed to get user form data" });
    }
  });
  
  // ============= USER PROFILE ROUTES =============
  
  // Update user profile/registration data
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify user can only update their own data
      if (req.session.userId !== id && !req.session.adminId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updated = await storage.updateUser(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  return httpServer;
}
