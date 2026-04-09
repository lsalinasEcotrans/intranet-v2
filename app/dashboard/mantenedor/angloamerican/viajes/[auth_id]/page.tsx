"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

import FormTurnoHCreate from "./forms/FormTurnoHCreate";
import FormTurnoHEdit from "./forms/FormTurnoHEdit";
import Form4x4 from "./forms/Form4x4";

import { Loader2 } from "lucide-react";

interface DetalleDia {
  dia: string;
  fecha: string;
}

interface DetalleViaje {
  dias?: DetalleDia[];
  modo?: string;
  horas?: { subida: string; bajada: string };
  fechas?: { inicio: string; termino: string };
}

interface ViajeResponse {
  ok: boolean;
  auth_id: number;
  grupo: string;
  turno: string;
  mode: "create" | "edit";
  detalle_viaje?: DetalleViaje | null;
}

export default function ViajePage() {
  const params = useParams();
  const auth_id = params?.auth_id as string;

  const [data, setData] = useState<ViajeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!auth_id) return;

    const fetchData = async () => {
      try {
        const res = await axios.get<ViajeResponse>(
          `https://ecotrans-pasajero-370980788525.europe-west1.run.app/dataPassenger/viaje-admin/${auth_id}`,
        );
        setData(res.data);
      } catch (err) {
        console.error("Error cargando viaje:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth_id]);

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

  // ────────────── ERROR ──────────────
  if (error || !data?.ok) {
    return <div className="p-8 text-red-500">Error cargando información</div>;
  }

  const turno = data.turno?.trim();
  const mode = data.mode?.trim();

  // ────────────── TURNO H ──────────────
  if (turno === "TurnoH" && mode === "create") {
    return <FormTurnoHCreate authId={data.auth_id} grupoNumero={data.grupo} />;
  }

  if (turno === "TurnoH" && mode === "edit") {
    return (
      <FormTurnoHEdit
        authId={data.auth_id}
        grupoNumero={data.grupo}
        detalleViaje={data.detalle_viaje}
      />
    );
  }

  // ────────────── 4x4 / 7x7 ──────────────
  if ((turno === "4x4" || turno === "7x7") && mode === "create") {
    return (
      <Form4x4
        authId={data.auth_id}
        grupoNumero={data.grupo}
        tipoTurno={turno}
        detalleReserva={data.detalle_viaje || undefined} // si existe, para edit
      />
    );
  }

  if ((turno === "4x4" || turno === "7x7") && mode === "edit") {
    return (
      <Form4x4
        authId={data.auth_id}
        grupoNumero={data.grupo}
        tipoTurno={turno}
        detalleReserva={data.detalle_viaje || undefined} // si existe, para edit
      />
    );
  }

  // ────────────── CASO NO IMPLEMENTADO ──────────────
  return <div className="p-8">Turno "{turno}" no implementado aún.</div>;
}
