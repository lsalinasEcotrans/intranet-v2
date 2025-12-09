"use client";

import { Input } from "@/components/ui/input";

interface DestinoFieldProps {
  value: string; // 👈 valor inicial
  onChange?: (v: string) => void; // opcional si después quieres editar
}

export default function DestinoField({ value, onChange }: DestinoFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Origen</label>

      <Input
        value={value} // 👉 aquí mostramos el valor inicial
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange} // si no hay onChange → queda solo lectura
      />
    </div>
  );
}
