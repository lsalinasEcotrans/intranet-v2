"use client";

import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
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

interface ConfirmActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onConfirm: () => void;
  title?: string;
  description?: string;
  variant?: "destructive" | "default";
}

export function ConfirmActionDialog({
  isOpen,
  onClose,
  isLoading,
  onConfirm,
  title = "¿Estás seguro?",
  description,
  variant = "destructive",
}: ConfirmActionDialogProps) {
  const isDestructive = variant === "destructive";

  // Textos contextuales según la variante
  const getTexts = () => {
    if (isDestructive) {
      return {
        title: title || "¿Eliminar usuario?",
        description:
          description ||
          "Esta acción no se puede deshacer. El usuario será eliminado del sistema.",
        icon: <AlertCircle className="h-6 w-6 text-red-600" />,
        confirmText: "Eliminar",
        confirmClass:
          "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
      };
    } else {
      return {
        title: title || "¿Resetear contraseña?",
        description:
          description ||
          "Se enviará un email al usuario con las instrucciones para crear una nueva contraseña.",
        icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
        confirmText: "Resetear",
        confirmClass:
          "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
      };
    }
  };

  const texts = getTexts();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className="flex items-start gap-4 space-y-0">
          <div className="shrink-0 pt-0.5">{texts.icon}</div>
          <div className="flex-1 space-y-2">
            <AlertDialogTitle className="text-lg">
              {texts.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              {texts.description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 pt-6">
          <AlertDialogCancel disabled={isLoading} className="border-gray-300">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={texts.confirmClass}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              texts.confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
