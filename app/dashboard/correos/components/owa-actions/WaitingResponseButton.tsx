"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, ShieldAlert } from "lucide-react";
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

interface SpamButtonProps {
  emailId: string;
  onNoInform?: (emailId: string) => Promise<void>;
}

export function PendingButton({ emailId, onNoInform }: SpamButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePending = async () => {
    try {
      setLoading(true);

      await onNoInform?.(emailId);

      setSuccess(true);

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
        <Button variant="outline">
          <Clock className="h-4 w-4" />
          Pendiente
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        {/* ------------------ CONFIRMACIÓN ------------------ */}
        {!success && (
          <>
            <AlertDialogHeader className="items-center">
              <div className="bg-blue-500/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                <Clock className="text-blue-600 size-6" />
              </div>

              <AlertDialogTitle>¿Marcar como pendiente?</AlertDialogTitle>

              <AlertDialogDescription className="text-center">
                Este correo quedará en estado{" "}
                <strong>Pendiente de confirmación</strong>.
                <p>No podrás revertir esta acción.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>

              <Button
                disabled={loading}
                onClick={handlePending}
                className="bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>Sí, marcar como pendiente</>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* ------------------ ÉXITO ------------------ */}
        {success && (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-blue-500/10">
              <ShieldAlert className="text-blue-600 size-8" />
            </div>

            <h3 className="text-lg font-semibold">
              Correo marcado como pendiente
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Redirigiendo al listado...
            </p>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
