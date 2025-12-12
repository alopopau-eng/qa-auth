import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

interface Step1Props {
  onNext: (isNewAccount: boolean, accountType: string) => void;
}

export function Step1AccountType({ onNext }: Step1Props) {
  const [accountMode, setAccountMode] = useState<"new" | "existing">("new");
  const [accountType, setAccountType] = useState<"citizen" | "visitor">("citizen");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleContinue = () => {
    if (!captchaToken) {
      toast.error("يرجى التحقق من أنك لست روبوت");
      return;
    }
    onNext(accountMode === "new", accountType);
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-center mb-8 pb-4 border-b border-gray-300">
        تسجيل الدخول / إنشاء حساب
      </h2>

      <div className="space-y-8 max-w-md mx-auto">
        <div className="space-y-4">
          <Label className="font-bold text-lg block text-center">
            اختر نوع العملية
          </Label>
          <RadioGroup
            value={accountMode}
            onValueChange={(v) => setAccountMode(v as "new" | "existing")}
            className="grid grid-cols-2 gap-4"
          >
            <div
              className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all ${
                accountMode === "new"
                  ? "border-[#1e60a6] bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setAccountMode("new")}
            >
              <div
                className={`p-3 rounded-full ${accountMode === "new" ? "bg-[#1e60a6]" : "bg-gray-100"}`}
              >
                <UserPlus
                  className={`h-8 w-8 ${accountMode === "new" ? "text-white" : "text-gray-500"}`}
                />
              </div>
              <RadioGroupItem value="new" id="new" className="sr-only" />
              <Label
                htmlFor="new"
                className="cursor-pointer font-bold text-lg text-center"
              >
                مستخدم جديد
              </Label>
              <span className="text-sm text-gray-500 text-center">
                إنشاء حساب جديد
              </span>
            </div>
            <div
              className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-all ${
                accountMode === "existing"
                  ? "border-[#1e60a6] bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setAccountMode("existing")}
            >
              <div
                className={`p-3 rounded-full ${accountMode === "existing" ? "bg-[#1e60a6]" : "bg-gray-100"}`}
              >
                <LogIn
                  className={`h-8 w-8 ${accountMode === "existing" ? "text-white" : "text-gray-500"}`}
                />
              </div>
              <RadioGroupItem
                value="existing"
                id="existing"
                className="sr-only"
              />
              <Label
                htmlFor="existing"
                className="cursor-pointer font-bold text-lg text-center"
              >
                مستخدم حالي
              </Label>
              <span className="text-sm text-gray-500 text-center">
                تسجيل الدخول
              </span>
            </div>
          </RadioGroup>
        </div>

        {accountMode === "new" && (
          <div className="space-y-4 pt-4 border-t border-gray-200" dir="rtl">
            <Label className="font-bold text-lg block">نوع الحساب</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(v) => setAccountType(v as "citizen" | "visitor")}
              className="space-y-3"
            >
              <div
                className={`flex items-center space-x-reverse space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  accountType === "citizen"
                    ? "border-[#1e60a6] bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <RadioGroupItem value="citizen" id="citizen" />
                <Label
                  htmlFor="citizen"
                  className="flex-1 cursor-pointer font-bold text-lg"
                >
                  مواطن / مقيم
                </Label>
              </div>
              <div
                className={`flex items-center space-x-reverse space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  accountType === "visitor"
                    ? "border-[#1e60a6] bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <RadioGroupItem value="visitor" id="visitor" />
                <Label
                  htmlFor="visitor"
                  className="flex-1 cursor-pointer font-bold text-lg"
                >
                  زائر
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
            hl="ar"
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={handleContinue}
            className="w-full bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 text-lg"
            data-testid="button-continue"
          >
            استمر
          </Button>
        </div>
      </div>
    </div>
  );
}
