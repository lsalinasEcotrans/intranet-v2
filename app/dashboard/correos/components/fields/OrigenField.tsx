"use client";

import { Input } from "@/components/ui/input";

interface OrigenFieldProps {
  text: string;
  latitud: number | string;
  longitud: number | string;
}

export default function OrigenField({
  text,
  latitud,
  longitud,
}: OrigenFieldProps) {
  return (
    <div className="space-y-3">
      {/* Texto del origen */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Origen</label>
        <Input value={text || ""} readOnly />
      </div>

      {/* Coordenadas */}
      <fieldset className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Latitud</label>
          <Input value={latitud || ""} readOnly />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Longitud</label>
          <Input value={longitud || ""} readOnly />
        </div>
      </fieldset>
    </div>
  );
}
