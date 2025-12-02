"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface PendingButtonProps {
  emailId: string;
  onConfirm?: () => void;
}

export function PendingButton({ emailId, onConfirm }: PendingButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <Clock className="h-4 w-4" />
        Pendiente de confirmación
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              ¿Marcar como pendiente de confirmación?
            </DialogTitle>
            <DialogDescription>
              Este correo se marcará como en espera de confirmación y podrá ser
              revisado más tarde.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Sí, marcar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
