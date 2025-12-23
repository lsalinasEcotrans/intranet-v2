"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

/* ================= TIPOS ================= */

interface NavSubItem {
  title: string;
  url: string;
  external?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon: any;
  items?: NavSubItem[];
}

/* ================= COMPONENTE ================= */

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild className="group/collapsible">
            <SidebarMenuItem>
              {/* ===== ITEM PRINCIPAL ===== */}
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="text-base font-medium min-h-11 py-2 gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>

                  {item.items && (
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>

              {/* ===== SUB ITEMS ===== */}
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        {subItem.external ? (
                          /* ===== LINK EXTERNO (RADIX SAFE) ===== */
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(
                                subItem.url,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }}
                            className="
                              flex w-full items-center gap-2
                              rounded-md px-2 py-1.5
                              text-sm font-medium
                              text-sidebar-foreground
                              hover:bg-sidebar-accent
                              transition-colors
                              text-left
                            "
                          >
                            <span>{subItem.title}</span>
                            <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ) : (
                          /* ===== LINK INTERNO ===== */
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={subItem.url}
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
