import React from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard,
  Shield,
  Home
} from "lucide-react";
import { useLocation } from "wouter";

interface FormData {
  email: string;
  fullNameArabic: string;
  fullNameEnglish: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  accountType?: string;
  address: {
    buildingNumber: string;
    area: string;
    street: string;
  };
}

interface Step5SuccessProps {
  formData: FormData;
}

export function Step5Success({ formData }: Step5SuccessProps) {
  const [, setLocation] = useLocation();

  const steps = [
    {
      title: "نوع الحساب",
      icon: User,
      status: "completed",
      details: formData.accountType === "citizen" ? "مواطن / مقيم" : "زائر"
    },
    {
      title: "البيانات الشخصية",
      icon: User,
      status: "completed",
      details: formData.fullNameArabic || "تم الإدخال"
    },
    {
      title: "كلمة المرور",
      icon: Shield,
      status: "completed",
      details: "تم التعيين بنجاح"
    },
    {
      title: "الدفع",
      icon: CreditCard,
      status: "completed",
      details: "10.00 ر.ق - تم الدفع"
    }
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">تم التسجيل بنجاح!</h2>
        <p className="text-gray-600">تم إنشاء حسابك في نظام التوثيق الوطني</p>
      </div>

      {/* Steps Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">ملخص التسجيل</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{step.title}</p>
                <p className="text-sm text-gray-500">{step.details}</p>
              </div>
              <span className="text-green-600 text-sm font-medium">مكتمل</span>
            </div>
          ))}
        </div>
      </div>

      {/* User Details */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6">
        <h3 className="font-bold text-lg mb-4 text-blue-800">بيانات الحساب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem icon={User} label="الاسم بالعربية" value={formData.fullNameArabic} />
          <DetailItem icon={User} label="الاسم بالإنجليزية" value={formData.fullNameEnglish} />
          <DetailItem icon={Mail} label="البريد الإلكتروني" value={formData.email} />
          <DetailItem icon={Phone} label="رقم الهاتف" value={formData.phoneNumber} />
          <DetailItem icon={Calendar} label="تاريخ الميلاد" value={formData.dateOfBirth} />
          <DetailItem icon={MapPin} label="الجنسية" value={formData.nationality === "qatar" ? "قطر" : "جنسية أخرى"} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setLocation("/")}
          className="flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-14 text-xl"
          data-testid="button-go-home"
        >
          <Home className="h-5 w-5 ml-2" />
          الصفحة الرئيسية
        </Button>
        <Button 
          onClick={() => setLocation("/login")}
          variant="outline"
          className="flex-1 bg-white border-gray-300 hover:bg-gray-50 text-gray-800 h-14 text-xl"
          data-testid="button-login"
        >
          تسجيل الدخول
        </Button>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
      <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value || "-"}</p>
      </div>
    </div>
  );
}
