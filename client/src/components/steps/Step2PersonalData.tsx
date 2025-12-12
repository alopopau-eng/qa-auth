import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";

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

interface Step2Props {
  onNext: (data: FormData) => void;
  onBack: () => void;
  initialData?: FormData;
}

export function Step2PersonalData({ onNext, onBack, initialData }: Step2Props) {
  const [formData, setFormData] = useState<FormData>(initialData || {
    email: "",
    fullNameArabic: "",
    fullNameEnglish: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    nationality: "qatar",
    address: {
      buildingNumber: "",
      area: "",
      street: "",
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullNameArabic || formData.fullNameArabic.trim().split(" ").length < 3) {
      newErrors.fullNameArabic = "يرجى إدخال الاسم الكامل (3 مقاطع على الأقل)";
    }

    if (!formData.fullNameEnglish || formData.fullNameEnglish.trim().split(" ").length < 3) {
      newErrors.fullNameEnglish = "Please enter full name (at least 3 parts)";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "رقم الهاتف مطلوب";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "تاريخ الميلاد مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-xl font-bold text-center mb-6 pb-4 border-b border-gray-300 bg-gray-200/50 py-3 rounded-t-lg -mx-6 -mt-6 md:-mx-8 md:-mt-8">
        يرجى تعبئة البيانات الشخصية
      </h2>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3">
          <Label className="font-bold text-base">الجنسية *</Label>
          <RadioGroup 
            value={formData.nationality} 
            onValueChange={(v) => setFormData({...formData, nationality: v})}
            className="flex gap-8"
          >
            <div className="flex items-center space-x-reverse space-x-2">
              <RadioGroupItem value="qatar" id="qatar" />
              <Label htmlFor="qatar" className="font-medium">قطر</Label>
            </div>
            <div className="flex items-center space-x-reverse space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="font-medium">جنسية اخرى</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-base">الاسم بالعربي *(من 3 مقاطع)</Label>
          <Input 
            className={`bg-white text-right h-12 ${errors.fullNameArabic ? 'border-red-500' : ''}`}
            placeholder="مثال... عمر هاشم الهاشم"
            value={formData.fullNameArabic}
            onChange={(e) => setFormData({...formData, fullNameArabic: e.target.value})}
            data-testid="input-name-arabic"
          />
          {errors.fullNameArabic && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.fullNameArabic}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-base">الاسم بالانجليزية *(من 3 مقاطع)</Label>
          <Input 
            className={`bg-white text-left h-12 ${errors.fullNameEnglish ? 'border-red-500' : ''}`}
            placeholder="Example... Omar Hashim Alhashim" 
            dir="ltr"
            value={formData.fullNameEnglish}
            onChange={(e) => setFormData({...formData, fullNameEnglish: e.target.value})}
            data-testid="input-name-english"
          />
          {errors.fullNameEnglish && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.fullNameEnglish}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-base">رقم الهاتف *</Label>
          <Input 
            className={`bg-white text-right h-12 ${errors.phoneNumber ? 'border-red-500' : ''}`}
            placeholder="أدخل رقم الهاتف"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            data-testid="input-phone"
          />
          {errors.phoneNumber && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.phoneNumber}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-base">تاريخ الميلاد * يوم/شهر/سنة</Label>
          <Input 
            type="date" 
            className={`bg-white text-right h-12 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            data-testid="input-dob"
          />
          {errors.dateOfBirth && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.dateOfBirth}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="font-bold text-base">الجنس *</Label>
          <RadioGroup 
            value={formData.gender}
            onValueChange={(v) => setFormData({...formData, gender: v})}
            className="flex gap-8"
          >
            <div className="flex items-center space-x-reverse space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="font-medium">ذكر</Label>
            </div>
            <div className="flex items-center space-x-reverse space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="font-medium">أنثى</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
           <Label className="font-bold text-base">العنوان</Label>
           <div className="bg-[#4a89c2] p-4 rounded-lg space-y-4">
              <div className="space-y-1">
                 <Label className="text-white text-sm">رقم المبنى</Label>
                 <Input 
                   className="bg-white h-10 border-none" 
                   placeholder="رقم المبنى"
                   value={formData.address.buildingNumber}
                   onChange={(e) => setFormData({
                     ...formData, 
                     address: {...formData.address, buildingNumber: e.target.value}
                   })}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <Label className="text-white text-sm">منطقة</Label>
                   <Input 
                     className="bg-white h-10 border-none" 
                     placeholder="منطقة"
                     value={formData.address.area}
                     onChange={(e) => setFormData({
                       ...formData, 
                       address: {...formData.address, area: e.target.value}
                     })}
                   />
                </div>
                <div className="space-y-1">
                   <Label className="text-white text-sm">شارع</Label>
                   <Input 
                     className="bg-white h-10 border-none" 
                     placeholder="شارع"
                     value={formData.address.street}
                     onChange={(e) => setFormData({
                       ...formData, 
                       address: {...formData.address, street: e.target.value}
                     })}
                   />
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-base">البريد الإلكتروني *</Label>
          <Input 
            type="email" 
            className={`bg-white text-left h-12 ${errors.email ? 'border-red-500' : ''}`}
            placeholder="example@email.com"
            dir="ltr"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            data-testid="input-email"
          />
          {errors.email && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.email}
            </p>
          )}
          <p className="text-gray-600 text-sm">سيتم إرسال رمز التحقق إلى هذا البريد</p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleSubmit} 
            type="button" 
            className="flex-1 bg-[#1e60a6] hover:bg-[#164e8a] text-white h-12 text-lg"
            data-testid="button-next"
          >
            استمر
          </Button>
          <Button 
            onClick={onBack} 
            type="button" 
            variant="outline" 
            className="flex-1 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 h-12 text-lg"
            data-testid="button-back"
          >
            رجوع
          </Button>
        </div>
      </form>
    </div>
  );
}
