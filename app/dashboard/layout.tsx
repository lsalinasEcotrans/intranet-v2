// app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "sonner";

interface UserData {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface MenuItem {
  url: string;
  icon: string;
  title: string;
  items: MenuItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    // Leer datos de las cookies
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.user_data) {
      try {
        setUser(JSON.parse(decodeURIComponent(cookies.user_data)));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    if (cookies.user_menu) {
      try {
        setMenu(JSON.parse(decodeURIComponent(cookies.user_menu)));
      } catch (e) {
        console.error("Error parsing menu data:", e);
      }
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar user={user} menuItems={menu} />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
            {/* Botón del sidebar a la izquierda */}
            <SidebarTrigger className="-ml-1" />

            {/* Empuja el toggle a la derecha */}
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>

          {/* Contenido */}
          {children}
          <Toaster position="top-right" richColors />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
