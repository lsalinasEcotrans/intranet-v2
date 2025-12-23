"use client";

import * as React from "react";
import axios from "axios";

import { AppSidebar } from "./components/layout/app-sidebar-mail";
import { MailViewer } from "./components/MailViewer";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const [message, setMessage] = React.useState<any>(null);

  const loadMessage = async (id: string) => {
    const res = await axios.post("/api/graph", {
      action: "getMessage",
      messageId: id,
    });
    setMessage(res.data);
  };

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar onSelectMessage={loadMessage} />

      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background border-b p-4 flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-medium">Correo</span>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <MailViewer message={message} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
