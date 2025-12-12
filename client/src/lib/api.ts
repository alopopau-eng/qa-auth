// API client for backend communication

export interface RegistrationData {
  username: string;
  password: string;
  email: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  address?: {
    buildingNumber?: string;
    area?: string;
    street?: string;
  };
  accountType?: string;
  registrationStatus?: string;
  paymentStatus?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface DashboardStats {
  totalVisitors: number;
  activeNow: number;
  applications: number;
  revenue: number;
  visitorsByCountry: Record<string, number>;
  applicationsByStatus: {
    pending: number;
    completed: number;
    review: number;
    rejected: number;
  };
}

export interface Application {
  id: string;
  userId: string | null;
  applicantName: string;
  applicantEmail: string;
  applicationType: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

class APIClient {
  private baseUrl = "/api";

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // OTP endpoints
  async requestOtp(email: string): Promise<{ success: boolean; message: string; _demoCode?: string }> {
    return this.request("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
    return this.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  // Heartbeat for online status
  async sendHeartbeat(page: string): Promise<{ success: boolean; onlineCount: number }> {
    return this.request("/heartbeat", {
      method: "POST",
      body: JSON.stringify({ page }),
    });
  }

  // Auth endpoints
  async register(data: RegistrationData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async adminLogin(credentials: LoginCredentials) {
    return this.request("/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Visitor tracking
  async trackVisitor(data: { page: string; country?: string; referrer?: string }) {
    return this.request("/visitors/track", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request("/admin/dashboard/stats");
  }

  async getApplications(limit = 50): Promise<Application[]> {
    return this.request(`/admin/applications?limit=${limit}`);
  }

  async updateApplicationStatus(id: string, status: string) {
    return this.request(`/admin/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getVisitorAnalytics(days = 7) {
    return this.request(`/admin/visitors/analytics?days=${days}`);
  }

  async getInboxData(): Promise<InboxData> {
    return this.request("/admin/inbox");
  }

  async getUserFormData(userId: string): Promise<User & { applicationId?: string; applicationStatus?: string; submittedAt?: string }> {
    return this.request(`/admin/users/${userId}/form`);
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullNameArabic: string | null;
  fullNameEnglish: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  accountType: string | null;
  registrationStatus: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

export interface Visitor {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  page: string;
  referrer: string | null;
  sessionId: string | null;
  visitedAt: string;
}

export interface InboxData {
  users: User[];
  applications: Application[];
  visitors: Visitor[];
  stats: {
    total: number;
    data: number;
    visitors: number;
    cards: number;
  };
}

export const api = new APIClient();
