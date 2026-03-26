"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Search,
  Shield,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Trash2,
  Edit2,
} from "lucide-react";

import { TableSkeleton } from "../components/table-skeleton";
import { DataTablePagination } from "../components/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { Role, Module } from "@/types/admin";

import { NewRoleDialog } from "./newrolesdialog";

interface ApiError {
  detail?: string;
  message?: string;
}

export function RolesTab() {
  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [filter, setFilter] = useState("");

  // Delete state
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  // Expanded rows for permissions
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filtered data
  const filteredRoles = useMemo(() => {
    if (!filter.trim()) return roles;
    const filterLower = filter.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(filterLower));
  }, [roles, filter]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    hasNextPage,
    hasPreviousPage,
    resetPage,
  } = usePagination(filteredRoles, { pageSize: 10 });

  // Reset to page 1 when filter changes
  useEffect(() => {
    resetPage();
  }, [filter, resetPage]);

  // Load data
  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get<Role[]>(API_ENDPOINTS.roles);
      setRoles(res.data);

      // Build available modules from all roles
      const allMenus = res.data.flatMap((r) => r.json_menu || []);
      // Get unique modules
      const uniqueModules = allMenus.reduce<Module[]>((acc, mod) => {
        if (!acc.find((m) => m.title === mod.title)) {
          acc.push(mod);
        }
        return acc;
      }, []);
      setAvailableModules(uniqueModules);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.message ||
        "Error al cargar los roles";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Toggle row expansion
  const toggleRowExpansion = (roleId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteRole) return;

    try {
      await axios.delete(`${API_ENDPOINTS.roles}/${deleteRole.id}`);
      toast.success("Rol eliminado correctamente");
      setDeleteRole(null);
      loadRoles();
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      toast.error(
        axiosError.response?.data?.detail || "Error al eliminar el rol",
      );
    }
  };

  // Count total permissions
  const countPermissions = (jsonMenu: Module[]) => {
    return jsonMenu.reduce((acc, menu) => {
      return acc + (menu.items?.length || 0);
    }, 0);
  };

  // Error state
  if (error && !isLoading && roles.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Error al cargar roles</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <Button onClick={loadRoles} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar rol..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Buscar roles"
          />
        </div>

        <NewRoleDialog
          onRoleCreated={loadRoles}
          availableModules={availableModules}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton
          columns={3}
          rows={5}
          headers={["Nombre", "Permisos", "Acciones"]}
        />
      ) : filteredRoles.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>
            <EmptyTitle>
              {filter ? "Sin resultados" : "No hay roles"}
            </EmptyTitle>
            <EmptyDescription>
              {filter
                ? `No se encontraron roles que coincidan con "${filter}"`
                : "Comienza creando tu primer rol"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nombre</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((role) => {
                  const isExpanded = expandedRows.has(role.id);
                  const totalPerms = countPermissions(role.json_menu);

                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleRowExpansion(role.id)}
                        >
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <span className="text-sm text-muted-foreground">
                              {role.json_menu.length} módulos, {totalPerms}{" "}
                              permisos
                            </span>
                          </div>

                          <CollapsibleContent className="mt-2">
                            <div className="space-y-2">
                              {role.json_menu.map((menu, menuIndex) => (
                                <div
                                  key={`${role.id}-${menuIndex}`}
                                  className="rounded-md border bg-muted/30 p-3"
                                >
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {menu.title}
                                  </p>

                                  <div className="flex flex-wrap gap-1">
                                    {menu.items?.map((item, itemIndex) => (
                                      <Badge
                                        key={`${role.id}-${menuIndex}-${itemIndex}`}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {item.title}
                                      </Badge>
                                    ))}
                                    {(!menu.items ||
                                      menu.items.length === 0) && (
                                      <span className="text-xs text-muted-foreground">
                                        Sin permisos específicos
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {role.json_menu.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Este rol no tiene permisos configurados
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteRole(role)}
                                aria-label={`Eliminar ${role.name}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={goToPage}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <strong>{deleteRole?.name}</strong>? Los usuarios con este rol
              perderán sus permisos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
