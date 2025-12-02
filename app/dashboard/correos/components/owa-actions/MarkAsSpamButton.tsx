"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SpamButtonProps {
  emailId: string;
  onConfirm?: () => void;
}

export function SpamButton({ emailId, onConfirm }: SpamButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="destructive" size="sm">
        <AlertTriangle className="h-4 w-4" />
        Marcar como Spam
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              ¿Está seguro de marcar este correo como spam?
            </DialogTitle>
            <DialogDescription>
              Esta acción marcará el correo como spam y afectará la reputación
              del remitente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Marcar como spam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
