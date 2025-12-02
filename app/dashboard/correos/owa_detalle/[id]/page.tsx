"use client";

import OWADetalle from "../../components/owa/OWADetalle";
import { useSearchParams, useParams } from "next/navigation";

export default function OWADetallePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  // Convertimos a minúsculas para comparar fácil
  const intencion = (searchParams.get("intencion") || "").toLowerCase();

  // Solo es "reserva" si literalmente coincide
  const esReserva = intencion === "reserva";

  return (
    <div className="p-4">
      <OWADetalle
        id={id as string}
        intencion={esReserva ? "Reserva" : "otros"}
      />
    </div>
  );
}
