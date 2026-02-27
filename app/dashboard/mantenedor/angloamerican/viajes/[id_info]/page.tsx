"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import FormTurnoHCreate from "./forms/FormTurnoHCreate";
import FormTurnoHEdit from "./forms/FormTurnoHEdit";

import { Loader2 } from "lucide-react";

interface DetalleViaje {
  dias: {
    dia: string;
    fecha: string;
  }[];
  modo: string;
}

interface ViajeResponse {
  ok: boolean;
  auth_id: number;
  grupo: number;
  turno: string;
  mode: "create" | "edit";
  detalle_viaje?: DetalleViaje | null;
}

export default function ViajePage() {
  const params = useParams();
  const id_info = params?.id_info as string;

  const [data, setData] = useState<ViajeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id_info) return;

    const fetchData = async () => {
      try {
        const res = await axios.get<ViajeResponse>(
          `https://ecotrans-pasajero-370980788525.europe-west1.run.app/dataPassenger/viaje-admin/${id_info}`,
        );

        console.log("DATA API:", res.data); // 🔎 Debug

        setData(res.data);
      } catch (err) {
        console.error("Error cargando viaje:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_info]);

  // ============================
  // LOADING
  // ============================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">
            Cargando información del pasajero...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.ok) {
    return <div className="p-8 text-red-500">Error cargando información</div>;
  }

  const turno = data.turno?.trim();
  const mode = data.mode?.trim();

  // ============================
  // TURNO H - CREATE
  // ============================

  if (turno === "TurnoH" && mode === "create") {
    return (
      <div className="p-8">
        <FormTurnoHCreate authId={data.auth_id} grupoNumero={data.grupo} />
      </div>
    );
  }

  // ============================
  // TURNO H - EDIT
  // ============================

  if (turno === "TurnoH" && mode === "edit") {
    return (
      <div className="p-8">
        <FormTurnoHEdit
          authId={data.auth_id}
          grupoNumero={data.grupo}
          detalleViaje={data.detalle_viaje}
        />
      </div>
    );
  }

  // ============================
  // OTROS TURNOS (4x4 / 7x7 futuro)
  // ============================

  return <div className="p-8">Turno "{turno}" no implementado aún.</div>;
}
