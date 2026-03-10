"use client";

import { usePathname } from "next/navigation";

export default function DashboardTitle() {
  const pathname = usePathname();

  return (
    <h1 className="text-2xl font-semibold capitalize">
      {pathname.replace("/", "") || "dashboard"}
    </h1>
  );
}
