"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CompleteButtonProps {
  emailId: string;
  onConfirm?: (reservaNumber: string) => void;
}

export function CompleteButton({ emailId, onConfirm }: CompleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [reservaNumber, setReservaNumber] = useState("");

  const handleConfirm = () => {
    onConfirm?.(reservaNumber);
    setReservaNumber("");
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="default" size="sm">
        <CheckCircle2 className="h-4 w-4" />
        Completar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              ¿Desea informar de la reserva?
            </DialogTitle>
            <DialogDescription>
              Ingrese el número de reserva para confirmar la acción.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reserva" className="text-sm font-medium">
                Número de Reserva
              </label>
              <Input
                id="reserva"
                placeholder="Ej: MBA-2024-789456"
                value={reservaNumber}
                onChange={(e) => setReservaNumber(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!reservaNumber.trim()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
