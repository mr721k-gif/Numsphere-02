"use client";

import React from "react";
import { PhoneCall } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export default function LoadingSpinner({ label = "Numsphere", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 bg-white ${className}`}>
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <PhoneCall className="text-blue-600 animate-bounce" size={28} />
        </div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold tracking-wide text-gray-900">numsphere</div>
        <div className="text-xs text-gray-500">Connecting…</div>
      </div>
    </div>
  );
}
