import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, AlertCircle, Shield } from "lucide-react";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { app } from "@/lib/firebase";

const auth = getAuth(app);

export default function FirebaseLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLocation("/admin");
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLocation("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (err.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير صالح");
      } else if (err.code === "auth/too-many-requests") {
        setError("تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-[#1e293b] rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">لوحة التحكم</h1>
            <p className="text-gray-400">تسجيل دخول المسؤول</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 bg-[#0f172a] border-gray-600 text-white placeholder:text-gray-500"
                  placeholder="admin@example.com"
                  required
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-[#0f172a] border-gray-600 text-white placeholder:text-gray-500"
                  placeholder="••••••••"
                  required
                  data-testid="input-admin-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold"
              disabled={loading}
              data-testid="button-admin-login"
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
