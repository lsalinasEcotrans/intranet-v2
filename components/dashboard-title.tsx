"use client";

import { usePathname } from "next/navigation";
import { dashboardTitles } from "@/lib/dashboard-titles";
import DashboardHeader from "./DashboardHeader";

export default function DashboardTitle() {
  const pathname = usePathname();
  const config = dashboardTitles[pathname];

  if (!config) return null;

  if (config.type === "welcome") {
    return <DashboardHeader />;
  }

  return <h1 className="text-2xl font-semibold">{config.title}</h1>;
}
