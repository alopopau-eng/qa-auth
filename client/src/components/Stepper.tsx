import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full py-6 md:py-8 bg-white shadow-sm mb-6 sticky top-20 z-30">
      <div className="container mx-auto px-4 overflow-x-auto">
        <div className="max-w-3xl mx-auto min-w-[320px]">
          <div className="relative flex justify-between items-center">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-200 -z-10 transform -translate-y-1/2 hidden md:block" />
            
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <div key={index} className="flex flex-col items-center bg-white px-2 md:px-4 z-10 flex-1">
                  <div 
                    className={cn(
                      "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold border-2 transition-all duration-300 mb-2 shrink-0",
                      isActive ? "bg-primary text-white border-primary shadow-md scale-110" : 
                      isCompleted ? "bg-primary text-white border-primary" : "bg-gray-50 text-gray-400 border-gray-200"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 md:h-6 md:w-6" /> : stepNumber}
                  </div>
                  <span 
                    className={cn(
                      "text-[10px] md:text-sm font-medium text-center transition-colors duration-300 hidden sm:block",
                      isActive ? "text-primary font-bold" : "text-gray-400"
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
