"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />
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
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
