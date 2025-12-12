import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Step6PhoneProviderProps {
  onNext: (providerData?: { provider: string; number: string; personalId: string; email: string; password: string }) => void;
  onBack: () => void;
}

export function Step6PhoneProvider({ onNext, onBack }: Step6PhoneProviderProps) {
  const { toast } = useToast();
  const [provider, setProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const providers = [
    { value: "ooredoo", label: "Ooredoo" },
    { value: "vodafone", label: "Vodafone" },
    { value: "zain", label: "Zain" },
    { value: "other", label: "مزود خدمة آخر" },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!provider) newErrors.provider = "يرجى اختيار مزود الخدمة";
    if (!phoneNumber || phoneNumber.length < 8) newErrors.phoneNumber = "يرجى إدخال رقم هاتف صحيح";
    if (!personalId.trim()) newErrors.personalId = "يرجى إدخال الرقم الشخصي";
    if (!email || !email.includes("@")) newErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    if (!password || password.length < 6) newErrors.password = "يرجى إدخال كلمة مرور آمنة (6 أحرف على الأقل)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ بيانات مزود الخدمة بنجاح",
      });
      onNext({ provider, number: phoneNumber, personalId, email, password });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Phone className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">بيانات مزود الخدمة</h2>
            <p className="text-gray-600">توثيق رقم الهاتف من خلال مزود الخدمة</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider" className="text-gray-700 font-medium">
            مزود الخدمة <span className="text-red-500">*</span>
          </Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger
              id="provider"
              className="w-full"
              data-testid="select-provider"
            >
              <SelectValue placeholder="اختر مزود الخدمة" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provider && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.provider}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700 font-medium">
            رقم الهاتف <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+974 XXXX XXXX"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value.replace(/\D/g, ""));
              if (errors.phoneNumber) {
                const newErrors = { ...errors };
                delete newErrors.phoneNumber;
                setErrors(newErrors);
              }
            }}
            className="w-full"
            data-testid="input-phone"
          />
          {errors.phoneNumber && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Personal ID */}
        <div className="space-y-2">
          <Label htmlFor="personalId" className="text-gray-700 font-medium">
            الرقم الشخصي لمالك البطاقة <span className="text-red-500">*</span>
          </Label>
          <Input
            id="personalId"
            type="text"
            placeholder="ID"
            value={personalId}
            onChange={(e) => {
              setPersonalId(e.target.value);
              if (errors.personalId) {
                const newErrors = { ...errors };
                delete newErrors.personalId;
                setErrors(newErrors);
              }
            }}
            className="w-full"
            data-testid="input-personal-id"
          />
          {errors.personalId && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.personalId}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            البريد الإلكتروني المعتمد بـ Ooredoo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                const newErrors = { ...errors };
                delete newErrors.email;
                setErrors(newErrors);
              }
            }}
            className="w-full"
            data-testid="input-email"
          />
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            كلمة المرور لتطبيق Ooredoo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                const newErrors = { ...errors };
                delete newErrors.password;
                setErrors(newErrors);
              }
            }}
            className="w-full"
            data-testid="input-password"
          />
          {errors.password && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            data-testid="button-back"
          >
            السابق
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-submit"
          >
            {isLoading ? "جاري الحفظ..." : "استمرار"}
          </Button>
        </div>
      </div>
    </div>
  );
}
