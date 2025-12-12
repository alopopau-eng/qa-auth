import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface StepLoginProps {
  onBack: () => void;
}

export function StepLogin({ onBack }: StepLoginProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.login({ username, password });
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام توثيق",
      });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-8 pb-4 border-b border-gray-300">
        تسجيل الدخول
      </h2>

      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800">الدخول بواسطة اسم المستخدم</h3>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="w-28 text-right font-bold text-gray-700">اسم المستخدم</label>
              <Input 
                className="flex-1 bg-white h-12 text-right" 
                placeholder="إسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="w-28 text-right font-bold text-gray-700">كلمة المرور</label>
              <Input 
                type="password"
                className="flex-1 bg-white h-12 text-right" 
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="robot" />
                <label htmlFor="robot" className="text-sm text-gray-600 cursor-pointer">
                  أنا لست برنامج روبوت
                </label>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin mb-1 opacity-20"></div>
                <span className="text-[10px] text-gray-400">reCAPTCHA</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 text-lg"
              data-testid="button-login"
            >
              {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "تسجيل الدخول"}
            </Button>
            <Button 
              type="button"
              onClick={onBack} 
              variant="outline" 
              className="flex-1 bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700 h-12 text-lg"
              data-testid="button-back"
            >
              رجوع
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
