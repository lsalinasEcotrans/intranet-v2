"use client";

import { useState } from "react";

interface Props {
  mode: "edit" | "create";
  authId: number;
}

export default function FormTurnoH({ mode, authId }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Formulario Turno 7x7 {mode === "edit" ? "Editar" : "Crear"}
      </h1>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Origen"
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder="Destino"
          className="border p-2 rounded w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {mode === "edit" ? "Actualizar viaje" : "Crear viaje"}
        </button>
      </form>
    </div>
  );
}
