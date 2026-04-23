"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  UserPlus,
  Key,
  Trash2,
  Edit,
  AlertCircle,
  Users,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Componentes locales
import { UserFormDialog } from "./components/userFormdialog";
import { ConfirmActionDialog } from "./components/confirmActionDialog";

export default function UsersPage() {
  const {
    usersQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    resetPassMutation,
  } = useUsers();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: users, isLoading, isError, error } = usersQuery;

  const getStateBadge = (estado: string) => {
    const states: Record<
      string,
      { label: string; variant: any; icon: string }
    > = {
      activo: {
        label: "Activo",
        variant: "default",
        icon: "🟢",
      },
      inactivo: {
        label: "Inactivo",
        variant: "secondary",
        icon: "🔴",
      },
      pendiente: {
        label: "Pendiente",
        variant: "outline",
        icon: "🟡",
      },
    };

    const state = states[estado] || states.inactivo;
    return (
      <Badge variant={state.variant} className="gap-1">
        <span>{state.icon}</span>
        {state.label}
      </Badge>
    );
  };

  const handleCreateOpen = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleResetClick = (userId: string) => {
    setActiveId(userId);
    setIsResetOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setActiveId(userId);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (selectedUser) {
      updateMutation.mutate(
        { id: selectedUser.id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setSelectedUser(null);
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (activeId) {
      deleteMutation.mutate(activeId, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setActiveId(null);
        },
      });
    }
  };

  const handleResetConfirm = () => {
    if (activeId) {
      resetPassMutation.mutate(activeId, {
        onSuccess: () => {
          setIsResetOpen(false);
          setActiveId(null);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-700" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            Administra los usuarios internos del sistema
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end">
          <Button
            onClick={handleCreateOpen}
            // className="bg-green-600 hover:bg-green-700 text-white gap-2 h-10 px-6 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar usuarios:{" "}
              {error instanceof Error ? error.message : "Intenta de nuevo"}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto" />
              <p className="text-gray-600 font-medium">Cargando usuarios...</p>
            </div>
          </div>
        ) : users && users.length > 0 ? (
          // Table
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 border-b">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">
                      Nombre
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Cliente
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Estado
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors border-b last:border-0"
                    >
                      <TableCell className="font-medium text-gray-900">
                        {u.nombre}
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">
                        {u.correo}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="text-sm">
                          <div className="font-medium">{u.displayName}</div>
                          <div className="text-xs text-gray-500">
                            {u.accountCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStateBadge(u.estado)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleEditClick(u)}
                              className="cursor-pointer gap-2 text-sm"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetClick(u.id)}
                              className="cursor-pointer gap-2 text-sm text-blue-600"
                            >
                              <Key className="h-4 w-4" />
                              Resetear Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(u.id)}
                              className="cursor-pointer gap-2 text-sm text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-600">
              Total:{" "}
              <span className="font-semibold text-gray-900">
                {users.length}
              </span>{" "}
              usuarios
            </div>
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sin usuarios
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer usuario interno
            </p>
            <Button
              onClick={handleCreateOpen}
              // className="bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Crear Primer Usuario
            </Button>
          </div>
        )}
      </div>

      {/* Modales */}
      <UserFormDialog
        user={selectedUser}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUser(null);
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
      />

      <ConfirmActionDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setActiveId(null);
        }}
        isLoading={deleteMutation.isPending}
        title="¿Eliminar usuario?"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmActionDialog
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setActiveId(null);
        }}
        isLoading={resetPassMutation.isPending}
        title="¿Resetear contraseña?"
        description="Se enviará un email al usuario con las instrucciones para crear una nueva contraseña."
        variant="default"
        onConfirm={handleResetConfirm}
      />
    </div>
  );
}
