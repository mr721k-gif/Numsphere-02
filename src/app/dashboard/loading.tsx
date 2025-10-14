"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";

export default function DashboardLoading() {
  return (
    <div className="bg-white min-h-screen w-full grid place-items-center">
      <LoadingSpinner />
    </div>
  );
}
