"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { TableSkeleton } from "../components/table-skeleton";
import { DataTablePagination } from "../components/data-table-pagination";
import { usePagination } from "@/hooks/use-pagination";
import type { User, RoleListItem, UserFormData } from "@/types/admin";

import { ExtraPermissionsEditor } from "./ExtraPermissionsEditor";

// 🔥 REACT QUERY HOOKS
import {
  useUsers,
  useRolesList,
  usePermissionsCatalog,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers"; // ← Crea este archivo

const INITIAL_FORM_STATE: UserFormData = {
  username: "",
  full_name: "",
  role_id: 0,
  extra_permissions: { modules: [] },
};

export function UsersTab() {
  // 🔥 REACT QUERY - Reemplaza useState + useEffect
  const usersQuery = useUsers();
  const rolesQuery = useRolesList();
  const permissionsQuery = usePermissionsCatalog();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  // Estados existentes (sin cambios)
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos procesados
  const users = usersQuery.data || [];
  const roles = rolesQuery.data || [];
  const permissionsCatalog = permissionsQuery.data || [];

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const searchLower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(searchLower) ||
        u.full_name.toLowerCase().includes(searchLower) ||
        u.role_name?.toLowerCase().includes(searchLower),
    );
  }, [users, search]);

  // Paginación (con los fixes anteriores)
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
    setPageSize,
  } = usePagination(filteredUsers, { pageSize: 10 });

  // Reset page cuando cambia search
  useEffect(() => {
    resetPage();
  }, [search, resetPage]);

  // Form handlers
  const resetForm = useCallback(() => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setForm(INITIAL_FORM_STATE);
  }, []);

  // 🔥 NUEVO handleSubmit con React Query
  const handleSubmit = async () => {
    if (!form.username || !form.full_name || !form.role_id) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        extra_permissions:
          form.extra_permissions?.modules?.length! > 0 || false // ✅ FIX con non-null assertion
            ? form.extra_permissions
            : null,
      };

      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: payload,
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Usuario creado correctamente");
      }

      resetForm();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Error al guardar el usuario";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 NUEVO handleDelete con React Query
  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      await deleteMutation.mutateAsync(deleteUser.id);
      toast.success("Usuario eliminado correctamente");
      setDeleteUser(null);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || "Error al eliminar el usuario";
      toast.error(errorMessage);
    }
  };

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id || 0,
      extra_permissions: user.extra_permissions || { modules: [] },
    });
    setIsDialogOpen(true);
  }, []);

  // 🔥 ESTADOS DE CARGAS/ERRORES CON REACT QUERY
  const isLoading =
    usersQuery.isPending || rolesQuery.isPending || permissionsQuery.isPending;

  const hasError = usersQuery.isError;

  // Error state
  if (hasError && users.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Error al cargar usuarios</EmptyTitle>
          <EmptyDescription>
            {usersQuery.error?.message || "Error desconocido"}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => usersQuery.refetch()} variant="outline">
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
            placeholder="Buscar por nombre, username o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Modifica los datos del usuario"
                  : "Completa los campos para crear un nuevo usuario"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </label>
                <Input
                  id="username"
                  placeholder="usuario.ejemplo"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium">
                  Nombre completo <span className="text-destructive">*</span>
                </label>
                <Input
                  id="full_name"
                  placeholder="Juan Pérez"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Rol <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.role_id ? String(form.role_id) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, role_id: Number(v) })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Permisos adicionales
                </label>
                <ExtraPermissionsEditor
                  baseMenu={permissionsCatalog}
                  value={form.extra_permissions}
                  onChange={(val) =>
                    setForm({ ...form, extra_permissions: val })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Guardando...
                  </>
                ) : editingUser ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton
          columns={5}
          rows={5}
          headers={["ID", "Nombre", "Username", "Rol", "Acciones"]}
        />
      ) : filteredUsers.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>
              {search ? "Sin resultados" : "No hay usuarios"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? `No se encontraron usuarios que coincidan con "${search}"`
                : "Comienza creando tu primer usuario"}
            </EmptyDescription>
          </EmptyHeader>
          {!search && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear usuario
            </Button>
          )}
        </Empty>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Username
                  </TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground sm:hidden">
                          {user.username}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {user.role_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handleEdit(user)}
                              disabled={updateMutation.isPending}
                              aria-label={`Editar ${user.full_name}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => setDeleteUser(user)}
                              disabled={deleteMutation.isPending}
                              aria-label={`Eliminar ${user.full_name}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{deleteUser?.full_name}</strong>? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
