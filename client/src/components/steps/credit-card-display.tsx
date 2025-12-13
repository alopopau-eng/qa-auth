"use client"
import { CreditCard } from "lucide-react"

interface CreditCardDisplayProps {
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
  isFlipped?: boolean
}

export function CreditCardDisplay({ cardNumber, cardName, expiry, cvv, isFlipped = false }: CreditCardDisplayProps) {
  // Format card number with spaces and mask if needed
  const formatDisplayNumber = (num: string) => {
    const cleaned = num.replace(/\s/g, "")
    if (cleaned.length === 0) return "0000 0000 0000 0000"

    // Pad with zeros if incomplete
    const padded = cleaned.padEnd(16, "0")
    return padded.match(/.{1,4}/g)?.join(" ") || "0000 0000 0000 0000"
  }

  const displayNumber = formatDisplayNumber(cardNumber)
  const displayName = cardName || "CARD HOLDER NAME"
  const displayExpiry = expiry || "MM/YY"

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto mb-8">
      <div
        className={`relative w-full h-56 transition-transform duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of Card */}
        <div
          className={`absolute inset-0 backface-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-6 flex flex-col justify-between ${
            isFlipped ? "invisible" : ""
          }`}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
          </div>

          {/* Card Content */}
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              {/* Chip */}
              <div className="w-12 h-10 rounded bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 shadow-md relative overflow-hidden">
                <div className="absolute inset-1 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm"></div>
                <div className="absolute top-2 left-2 right-2 h-px bg-yellow-600/30"></div>
                <div className="absolute top-3 left-2 right-2 h-px bg-yellow-600/30"></div>
                <div className="absolute top-4 left-2 right-2 h-px bg-yellow-600/30"></div>
              </div>

              {/* Contactless Icon */}
              <svg
                className="w-8 h-8 text-white/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M17 6.1a9 9 0 0 1 0 11.8" />
                <path d="M7 6.1a9 9 0 0 0 0 11.8" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            {/* Card Number */}
            <div className="font-mono text-white text-xl tracking-widest font-medium drop-shadow-lg">
              {displayNumber}
            </div>

            {/* Card Details */}
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-white/70 text-xs uppercase tracking-wider font-medium">Card Holder</div>
                <div className="text-white font-semibold uppercase tracking-wide text-sm">{displayName}</div>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-white/70 text-xs uppercase tracking-wider font-medium">Expires</div>
                <div className="text-white font-semibold text-sm font-mono">{displayExpiry}</div>
              </div>
            </div>
          </div>

          {/* Card Brand Logo */}
          <div className="absolute bottom-6 right-6 opacity-30">
            <CreditCard className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Back of Card */}
        <div
          className={`absolute inset-0 backface-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rotate-y-180 ${
            !isFlipped ? "invisible" : ""
          }`}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-12 bg-black mt-8"></div>

          {/* CVV Section */}
          <div className="px-6 mt-6">
            <div className="bg-white rounded h-10 flex items-center justify-end px-4">
              <span className="font-mono text-black font-bold tracking-widest">{cvv || "***"}</span>
            </div>
            <p className="text-white/70 text-xs mt-2 text-right">CVV</p>
          </div>

          {/* Pattern on back */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-20 left-0 w-full h-32 bg-white/20 transform -skew-y-6"></div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
