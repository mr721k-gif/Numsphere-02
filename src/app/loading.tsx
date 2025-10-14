"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";

export default function AppLoading() {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-white">
      <LoadingSpinner />
    </div>
  );
}
