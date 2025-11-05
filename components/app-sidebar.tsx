// components/app-sidebar.tsx
"use client";

import * as React from "react";
import {
  FileCheck,
  HandCoins,
  Command,
  Handshake,
  Headset,
  LifeBuoy,
  FileChartPieIcon,
  MonitorCog,
  FlaskConical,
  Wrench,
  Database,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: UserData | null;
  menuItems: MenuItem[];
}

// Mapeo de iconos
const getIcon = (iconName: string | null) => {
  if (!iconName) return Command;
  const Icon = (Icons as any)[iconName];
  return Icon || Command;
};

// NavSecondary es fijo
const navSecondary = [
  {
    title: "Soporte",
    url: "/dashboard/soporte",
    icon: LifeBuoy,
  },
];

export function AppSidebar({ user, menuItems, ...props }: AppSidebarProps) {
  const router = useRouter();

  // Transformar menuItems de la API al formato que espera NavMain
  const navMain = React.useMemo(() => {
    return menuItems.map((item) => ({
      title: item.title,
      url: item.url,
      icon: getIcon(item.icon),
      items: item.items.map((subItem) => ({
        title: subItem.title,
        url: subItem.url,
      })),
    }));
  }, [menuItems]);

  // Datos del usuario para NavUser
  const userData = React.useMemo(() => {
    if (!user) {
      return {
        name: "Usuario",
        email: "usuario@ecotrans.cl",
        avatar: "/avatars/default.jpg",
      };
    }
    return {
      name: user.fullName,
      email: `${user.username}@ecotrans.cl`,
      avatar: `/avatars/${user.username}.jpg`,
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="text-xl font-medium">Ecotrans</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
