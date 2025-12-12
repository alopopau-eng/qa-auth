import React, { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, ShieldCheck, Lock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PaymentGateway() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const validateCard = () => {
    if (!cardName.trim()) return "يرجى إدخال الاسم على البطاقة";
    if (cardNumber.replace(/\s/g, "").length < 16) return "رقم البطاقة غير صحيح";
    if (!expiry || expiry.length < 5) return "تاريخ الانتهاء غير صحيح";
    if (!cvv || cvv.length < 3) return "رمز الأمان غير صحيح";
    return null;
  };

  const handlePayment = () => {
    const error = validateCard();
    if (error) {
      toast({
        title: "خطأ",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Generate demo OTP and show OTP modal
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(code);
    setShowOtp(true);
    setCooldown(60);
    toast({
      title: "تم إرسال رمز التحقق",
      description: "تم إرسال رمز التحقق إلى هاتفك المسجل لدى البنك",
    });
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...otpDigits];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newDigits[i] = digit;
    });
    setOtpDigits(newDigits);
  };

  const handleVerifyOtp = () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsVerifying(true);

    // Simulate verification
    setTimeout(() => {
      if (code === demoCode) {
        toast({
          title: "تم الدفع بنجاح",
          description: "تمت عملية الدفع وتسجيل حسابك بنجاح",
        });
        setLocation("/");
      } else {
        setOtpError("رمز التحقق غير صحيح");
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
      setIsVerifying(false);
    }, 1500);
  };

  const resendOtp = () => {
    if (cooldown > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(code);
    setCooldown(60);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    toast({
      title: "تم إعادة الإرسال",
      description: "تم إرسال رمز تحقق جديد",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex justify-center items-start md:items-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Card Preview & Order Summary */}
            <div className="space-y-6 order-2 md:order-1">
                {/* Credit Card Visualization */}
                <div className="relative h-56 w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden text-white p-6 flex flex-col justify-between transform transition-transform hover:scale-[1.02] duration-300">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-blue-500 opacity-10 rounded-full blur-2xl"></div>
                    
                    <div className="flex justify-between items-start z-10">
                        <img src="https://img.icons8.com/color/48/000000/chip-card.png" alt="Chip" className="h-10 w-10 opacity-90" />
                        <div className="flex flex-col items-end">
                             <h3 className="text-sm font-semibold opacity-70 tracking-widest">CREDIT CARD</h3>
                             <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-8 mt-1" />
                        </div>
                    </div>

                    <div className="space-y-6 z-10">
                        <div className="space-y-1">
                            <span className="text-xs uppercase opacity-70 tracking-wider">Card Number</span>
                            <div className="text-2xl font-mono tracking-wider font-bold drop-shadow-md min-h-[32px]">
                                {cardNumber || "**** **** **** ****"}
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-xs uppercase opacity-70 tracking-wider">Card Holder</span>
                                <div className="text-sm font-bold uppercase tracking-wide truncate max-w-[180px]">
                                    {cardName || "YOUR NAME"}
                                </div>
                            </div>
                            <div className="space-y-1 text-left">
                                <span className="text-xs uppercase opacity-70 tracking-wider">Expires</span>
                                <div className="text-sm font-bold tracking-wider">
                                    {expiry || "MM/YY"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Box */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">ملخص الدفع</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">رسوم التسجيل</span>
                        <span className="font-bold">10.00 ر.ق</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">الضريبة</span>
                        <span className="font-bold">0.00 ر.ق</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-900">المجموع الكلي</span>
                        <span className="font-bold text-xl text-[#1e60a6]">10.00 ر.ق</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Payment Form or OTP */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8 order-1 md:order-2">
                {!showOtp ? (
                  <>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">الدفع الإلكتروني</h1>
                            <p className="text-sm text-gray-500 mt-1">أدخل بيانات البطاقة لإتمام العملية</p>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
                            <Lock className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3 mb-6">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">بياناتك مشفرة ومحمية بنسبة 100%</span>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                        <div className="space-y-3">
                            <Label className="font-bold text-sm text-gray-700">طريقة الدفع</Label>
                            <RadioGroup defaultValue="visa" className="grid grid-cols-3 gap-3">
                                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                                     <RadioGroupItem value="visa" id="visa" className="sr-only" />
                                     <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-8 mb-2" alt="Visa" />
                                     <span className="text-xs font-bold text-gray-600">Visa</span>
                                </label>
                                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                                     <RadioGroupItem value="master" id="master" className="sr-only" />
                                     <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-8 mb-2" alt="Mastercard" />
                                     <span className="text-xs font-bold text-gray-600">Mastercard</span>
                                </label>
                                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                                     <RadioGroupItem value="naps" id="naps" className="sr-only" />
                                     <CreditCard className="h-8 w-8 mb-2 text-gray-400" />
                                     <span className="text-xs font-bold text-gray-600">Debit / NAPS</span>
                                </label>
                            </RadioGroup>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="font-bold text-sm text-gray-700">الاسم على البطاقة</Label>
                                <Input 
                                    className="text-right h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                    placeholder="الاسم كما يظهر على البطاقة" 
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value)}
                                    data-testid="input-card-name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold text-sm text-gray-700">رقم البطاقة</Label>
                                <div className="relative dir-ltr">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input 
                                        className="pl-10 text-left h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors font-mono tracking-widest" 
                                        placeholder="0000 0000 0000 0000" 
                                        maxLength={19}
                                        value={cardNumber}
                                        onChange={(e) => {
                                            const formatted = formatCardNumber(e.target.value);
                                            setCardNumber(formatted);
                                        }}
                                        data-testid="input-card-number"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm text-gray-700">تاريخ الانتهاء</Label>
                                    <Input 
                                        className="text-center h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                        placeholder="MM / YY" 
                                        maxLength={5}
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        data-testid="input-expiry"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-sm text-gray-700 flex items-center justify-between">
                                        <span>رمز الأمان (CVV)</span>
                                    </Label>
                                    <Input 
                                        className="text-center h-12 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                        placeholder="123" 
                                        maxLength={3}
                                        type="password"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value)}
                                        data-testid="input-cvv"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button 
                          type="submit"
                          className="w-full bg-[#1e60a6] hover:bg-[#164e8a] text-white h-14 text-lg font-bold rounded-lg shadow-md hover:shadow-lg transition-all mt-2"
                          data-testid="button-pay"
                        >
                            إتمام عملية الدفع (10.00 ر.ق)
                        </Button>
                    </form>
                  </>
                ) : (
                  /* OTP Verification Section */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">التحقق من البطاقة</h2>
                      <p className="text-gray-600">أدخل رمز التحقق المرسل إلى هاتفك</p>
                    </div>

                    {/* Demo Code Display */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-700 mb-1">رمز التحقق (للعرض التوضيحي فقط):</p>
                      <p className="text-2xl font-mono font-bold text-yellow-800">{demoCode}</p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2 dir-ltr" onPaste={handlePaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className={`w-12 h-14 text-center text-2xl font-bold border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            otpError ? "border-red-500" : digit ? "border-blue-500" : "border-gray-300"
                          }`}
                          data-testid={`input-card-otp-${index}`}
                        />
                      ))}
                    </div>

                    {/* Error Message */}
                    {otpError && (
                      <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <span>{otpError}</span>
                      </div>
                    )}

                    {/* Resend Button */}
                    <div className="text-center">
                      <button
                        onClick={resendOtp}
                        disabled={cooldown > 0}
                        className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-2 mx-auto"
                        data-testid="button-resend-card-otp"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال الرمز"}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={isVerifying || otpDigits.join("").length !== 6}
                        className="flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-14 text-xl"
                        data-testid="button-verify-card-otp"
                      >
                        {isVerifying ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 ml-2" />
                            تأكيد الدفع
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowOtp(false)}
                        type="button"
                        variant="outline"
                        className="flex-1 bg-white border-gray-300 hover:bg-gray-50 text-gray-800 h-14 text-xl"
                        data-testid="button-back-card-otp"
                      >
                        تعديل البطاقة
                      </Button>
                    </div>
                  </div>
                )}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
