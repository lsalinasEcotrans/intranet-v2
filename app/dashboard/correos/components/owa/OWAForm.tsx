"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiResponse {
  content: string;
  idCorreo: number;
  mensaje_ia: string; // viene como string con JSON dentro
}

interface contentItem {
  accountIA: number | null;
  accountCode: number | null;
  displayName: string;
}

interface MensajeIAItem {
  nota: string;
  vias: any[];
  pickup: {
    note: string;
    text: string;
    latitud: number;
    longitud: number;
    placesIdsorigen: any[];
  };
  Telefono: string;
  destination: {
    note: string;
    text: string;
    latitud: number;
    longitud: number;
    placesIdsdestino: any[];
  };
  pickupDueTime: string;
  nombrePasajero: string;
  "Centro de Costo": string;
  extraPassengerDetails: any[];
}

export default function OWADetalle({ id }: { id: string }) {
  const [data, setData] = useState<MensajeIAItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get<ApiResponse>(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/bodys/detalle/${id}`
        );

        const parsed = JSON.parse(res.data.mensaje_ia);
        setData(parsed[0]);
      } catch (err) {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="p-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-6 w-56" />
        </div>
      </div>
    );

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>No hay datos disponibles.</p>;

  return (
    <div className="px-8 py-4">
      <h2 className="text-lg font-semibold mb-2">Detalles del mensaje</h2>
      <div className="mt-4 border rounded-lg p-4 bg-gray-50">
        <p>
          <strong>Nota:</strong> {data.nota}
        </p>
        <p>
          <strong>Pasajero:</strong> {data.nombrePasajero}
        </p>
        <p>
          <strong>Teléfono:</strong> {data.Telefono}
        </p>
        <p>
          <strong>Centro de Costo:</strong> {data["Centro de Costo"]}
        </p>

        <div className="mt-4">
          <p className="font-semibold">Origen:</p>
          <p>{data.pickup.text}</p>
          <p>{data.pickup.latitud}</p>
          <p>{data.pickup.longitud}</p>
        </div>

        <div className="mt-4">
          <p className="font-semibold">Destino:</p>
          <p>{data.destination.text}</p>
          <p>{data.destination.latitud}</p>
          <p>{data.destination.longitud}</p>
        </div>

        <p className="mt-4">
          <strong>Fecha Pickup:</strong> {data.pickupDueTime}
        </p>
      </div>
    </div>
  );
}
