"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CompleteButtonProps {
  emailId: string;
  onNoInform?: (emailId: string) => Promise<void>;
}

export function CompleteButton({ emailId, onNoInform }: CompleteButtonProps) {
  const router = useRouter();

  // Estados locales
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);

      await onNoInform?.(emailId); // llamada API

      // Mostrar mensaje de éxito
      setSuccess(true);

      // Esperar un poco y redirigir
      setTimeout(() => {
        router.push("/dashboard/correos");
      }, 1500);
    } catch (error) {
      console.error("❌ Error:", error);
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="h-4 w-4" />
          Completar
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        {/* ------------------ MENSAJE NORMAL ------------------ */}
        {!success && (
          <>
            <AlertDialogHeader className="items-center">
              <div className="bg-green-500/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                <CheckCheck className="text-green-600 size-6" />
              </div>

              <AlertDialogTitle>
                ¿Confirmas marcar como completado?
              </AlertDialogTitle>

              <AlertDialogDescription className="text-center">
                El correo se marcará como <strong>completado</strong>.
                <div>No podrás revertir esta acción.</div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>

              <Button
                disabled={loading}
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 text-white focus-visible:ring-green-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>Sí, completar</>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ------------------ MENSAJE ÉXITO ------------------ */}
        {success && (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="text-green-600 size-8" />
            </div>

            <h3 className="text-lg font-semibold">Correo completado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Redirigiendo al listado...
            </p>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
