"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BookingResultDialogProps {
  open: boolean;
  onNoInform: () => void;
  onInform: () => void;
}

export default function BookingResultDialog({
  open,
  onNoInform,
  onInform,
}: BookingResultDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Reserva creada correctamente</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          La reserva fue creada exitosamente. ¿Deseas informar esta reserva al
          cliente?
        </p>

        <div className="flex gap-3 pt-4">
          <Button variant="destructive" className="flex-1" onClick={onNoInform}>
            No informar
          </Button>

          <Button className="flex-1" onClick={onInform}>
            Informar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
