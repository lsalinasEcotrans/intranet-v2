"use client";

import * as React from "react";
import axios from "axios";
import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react";

import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

interface Message {
  id: string;
  subject: string;
  bodyPreview: string;
  from?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
}

interface UserInfo {
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSelectMessage: (id: string) => void;
}

const navItems = [
  { title: "Inbox", icon: Inbox, folder: "inbox" },
  { title: "Drafts", icon: File, folder: "drafts" },
  { title: "Sent", icon: Send, folder: "sentitems" },
  { title: "Junk", icon: ArchiveX, folder: "junkemail" },
  { title: "Trash", icon: Trash2, folder: "deleteditems" },
];

export function AppSidebar({ onSelectMessage, ...props }: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState(navItems[0]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const { setOpen } = useSidebar();

  // =========================
  // User info
  // =========================
  const getUserInfo = React.useCallback(async () => {
    try {
      const res = await axios.post("/api/graph", {
        action: "getUserInfo",
      });
      setUserInfo(res.data);
    } catch {
      setUserInfo({
        displayName: "Usuario",
        userPrincipalName: "usuario@ecotranschile.cl",
      });
    }
  }, []);

  // =========================
  // Messages
  // =========================
  const getMessages = React.useCallback(async (folder: string) => {
    try {
      setLoading(true);

      const res = await axios.post("/api/graph", {
        action: "getMessages",
        folder,
      });

      setMessages(res.data.value || []);
    } catch (err) {
      console.error("Error fetching messages", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    getUserInfo();
    getMessages("inbox");
  }, [getUserInfo, getMessages]);

  const filteredMessages = showUnreadOnly
    ? messages.filter((m) => !m.isRead)
    : messages;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* ================= SIDEBAR IZQUIERDA ================= */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a>
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid text-left text-sm">
                    <span className="font-medium">Ecotrans Chile</span>
                    <span className="text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={activeItem.title === item.title}
                      onClick={() => {
                        setActiveItem(item);
                        getMessages(item.folder);
                        setOpen(true);
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {userInfo && (
            <NavUser
              user={{
                name: userInfo.displayName,
                email: userInfo.mail || userInfo.userPrincipalName,
                avatar: "/avatars/shadcn.jpg",
              }}
            />
          )}
        </SidebarFooter>
      </Sidebar>

      {/* ================= LISTA DE MENSAJES ================= */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium">{activeItem.title}</div>
            <Label className="flex items-center gap-2 text-sm">
              No leídos
              <Switch
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              />
            </Label>
          </div>
          <SidebarInput placeholder="Buscar mensajes..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {loading ? (
                <div className="p-4 text-center text-sm">
                  Cargando mensajes...
                </div>
              ) : (
                filteredMessages.map((mail) => (
                  <button
                    key={mail.id}
                    onClick={() => onSelectMessage(mail.id)}
                    className={`w-full text-left border-b p-4 text-sm hover:bg-sidebar-accent ${
                      !mail.isRead ? "bg-sidebar-accent/50 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {mail.from?.emailAddress?.name || "Sin nombre"}
                      </span>
                      <span className="ml-auto text-xs">
                        {formatDate(mail.receivedDateTime)}
                      </span>
                    </div>
                    <div>{mail.subject || "(Sin asunto)"}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {mail.bodyPreview}
                    </div>
                  </button>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
