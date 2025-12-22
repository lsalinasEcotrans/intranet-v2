"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InformarReservaDialogProps {
  open: boolean;
  bookingNumber?: number | null;
  onClose?: () => void;
}

export default function InformarReservaDialog({
  open,
  bookingNumber,
  onClose,
}: InformarReservaDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Informar reserva al cliente</DialogTitle>
        </DialogHeader>

        {/* =======================
            Info reserva
        ======================= */}
        <div className="rounded-md border p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">Número de reserva</p>
          <p className="text-lg font-semibold">
            {bookingNumber ?? "Cargando..."}
          </p>
        </div>

        {/* =======================
            Editor placeholder
        ======================= */}
        <div className="mt-4 rounded-md border border-dashed p-6 text-center text-muted-foreground">
          <p className="font-medium">Editor de correo</p>
          <p className="text-sm">
            Aquí se cargará el editor con la información de la reserva.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button>Enviar información</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
