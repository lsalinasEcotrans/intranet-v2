import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userActions } from "@/services/dashboard-cliente";
import { toast } from "sonner";
import { AxiosError } from "axios";

export const USERS_KEY = ["users"];

interface ErrorResponse {
  message?: string;
  detail?: string;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse;
    return (
      data?.message ||
      data?.detail ||
      error.message ||
      "Error al procesar la solicitud"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Error desconocido";
};

export function useUsers() {
  const queryClient = useQueryClient();

  // Listar usuarios
  const usersQuery = useQuery({
    queryKey: USERS_KEY,
    queryFn: userActions.getAll,
    retry: 2,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });

  // Crear usuario
  const createMutation = useMutation({
    mutationFn: userActions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("✅ Usuario creado con éxito");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(`❌ Error: ${message}`);
      console.error("Create error:", error);
    },
  });

  // Actualizar usuario
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      userActions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("✅ Usuario actualizado correctamente");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(`❌ Error: ${message}`);
      console.error("Update error:", error);
    },
  });

  // Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: userActions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success("✅ Usuario eliminado correctamente");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(`❌ Error: ${message}`);
      console.error("Delete error:", error);
    },
  });

  // Resetear contraseña
  const resetPassMutation = useMutation({
    mutationFn: userActions.resetPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      toast.success(
        "✅ Email de reseteo enviado. Usuario en estado pendiente.",
      );
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(`❌ Error: ${message}`);
      console.error("Reset password error:", error);
    },
  });

  return {
    usersQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    resetPassMutation,
  };
}
