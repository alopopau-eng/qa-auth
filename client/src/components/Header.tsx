import React, { useState } from "react";
import { Link } from "wouter";
import logo from "@assets/generated_images/logo_for_tawtheeq_national_authentication_system.png";
import { Globe, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <img src={logo} alt="Tawtheeq Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            <div className="flex flex-col items-start">
              <span className="text-primary font-bold text-base md:text-lg leading-tight">نظام التوثيق الوطني</span>
              <span className="text-primary/80 text-[10px] md:text-xs font-semibold tracking-wide">National Authentication System</span>
            </div>
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
            <span className="font-medium">العربية</span>
            <Globe className="h-5 w-5" />
          </button>
          
          <div className="border-r border-gray-300 h-8 mx-2"></div>

          <Link href="/login" className="flex flex-col items-end group">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary font-bold group-hover:underline">توثيق</span>
              <img src={logo} alt="Tawtheeq Small" className="h-6 w-6 object-contain opacity-80" />
            </div>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] pt-12" dir="rtl">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                  <img src={logo} alt="Logo" className="h-12 w-12" />
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-primary">نظام التوثيق الوطني</span>
                    <span className="text-xs text-gray-500">National Authentication System</span>
                  </div>
                </div>

                <nav className="flex flex-col gap-4">
                  <Link href="/" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700 font-medium" onClick={() => setIsOpen(false)}>
                    الرئيسية
                  </Link>
                  <Link href="/login" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700 font-medium" onClick={() => setIsOpen(false)}>
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-700 font-medium" onClick={() => setIsOpen(false)}>
                    تسجيل مستخدم جديد
                  </Link>
                </nav>

                <div className="mt-auto pt-6 border-t border-gray-100">
                  <button className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg text-gray-700 font-medium">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <span>English</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
