import React from "react";

import { UsersTab } from "./components/users-tab";
import { RolesTab } from "./components/roles-tab";

import { Users, ShieldUser } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPage() {
  return (
    <div className="p-8 bg-muted/50">
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <Tabs defaultValue="usuarios" className="gap-4">
              <TabsList className="grid w-full h-full grid-cols-2">
                <TabsTrigger
                  value="usuarios"
                  className="flex flex-col items-center gap-1 px-2.5 sm:px-3"
                >
                  <Users />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger
                  value="roles"
                  className="flex flex-col items-center gap-1 px-2.5 sm:px-3"
                >
                  <ShieldUser />
                  Roles
                </TabsTrigger>
              </TabsList>
              <TabsContent value="usuarios" className="mt-6">
                <UsersTab />
              </TabsContent>
              <TabsContent value="roles" className="mt-6">
                <RolesTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
