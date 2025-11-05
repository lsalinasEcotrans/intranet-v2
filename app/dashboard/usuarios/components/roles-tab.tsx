"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewRoleDialog } from "./newrolesdialog";

interface MenuItem {
  url: string;
  title: string;
  icon?: string | null;
  items?: MenuItem[];
}

interface Role {
  id: number;
  name: string;
  json_menu: MenuItem[];
  created_at: string;
}

export function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/roles"
      );
      setRoles(response.data);
    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  if (loading) return <p>Cargando roles...</p>;

  const filteredRoles = roles.filter((role) => {
    const permisos = role.json_menu
      .flatMap((menu) => menu.items?.map((item) => item.title) ?? [])
      .join(" ");
    return (
      role.name.toLowerCase().includes(filter.toLowerCase()) ||
      permisos.toLowerCase().includes(filter.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Pasamos callback */}
        <NewRoleDialog onRoleCreated={fetchRoles} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Permisos Asignados</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.json_menu.map((menu, menuIndex) => (
                      <div key={menuIndex} className="flex flex-wrap gap-1">
                        {/* Badge padre */}
                        <Badge variant="default">{menu.title}</Badge>
                        {/* Badges hijos */}
                        {menu.items?.map((item, itemIndex) => (
                          <Badge key={itemIndex} variant="secondary">
                            {item.title}
                          </Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No se encontraron roles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
