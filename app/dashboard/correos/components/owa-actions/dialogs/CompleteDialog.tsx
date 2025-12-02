"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function CompleteDialog({ open, setOpen, messageId }: any) {
  const [reserva, setReserva] = useState("");

  const handleConfirm = async () => {
    console.log("Completar reserva", reserva, messageId);

    // Aquí luego harás:
    // await fetch("/api/correos/completar", { ... })

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Completar reserva</DialogTitle>
        </DialogHeader>

        <p className="text-gray-600 mb-2">
          Ingrese el número de reserva asociado a este correo.
        </p>

        <input
          type="text"
          className="w-full border rounded-lg p-2"
          placeholder="Número de reserva"
          value={reserva}
          onChange={(e) => setReserva(e.target.value)}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Completar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
