"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";

export default function AuthLoading() {
  return (
    <div className="bg-white min-h-screen w-full grid place-items-center">
      <LoadingSpinner />
    </div>
  );
}
