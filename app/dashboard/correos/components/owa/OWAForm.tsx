"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import ConvenioField from "../fields/ConvenioField";
import ConvenioDialog from "../fields/ConvenioDialog";

interface ApiResponse {
  content: string;
  idCorreo: number;
  mensaje_ia: string;
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
  const [data, setData] = useState<MensajeIAItem[] | null>(null);
  const [content, setContent] = useState<contentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [convenio, setConvenio] = useState("");
  const [openConvenioDialog, setOpenConvenioDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get<ApiResponse>(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/bodys/detalle/${id}`
        );

        // mensaje_ia puede ser 1 objeto o varios
        const parsedIA = JSON.parse(res.data.mensaje_ia);
        const parsedIAArray = Array.isArray(parsedIA) ? parsedIA : [parsedIA];

        setData(parsedIAArray);

        const parsedContent = JSON.parse(res.data.content);
        setContent(parsedContent);
      } catch (err) {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    if (content?.displayName) {
      const formattedConvenio = content.accountCode
        ? `${content.accountCode} - ${content.displayName}`
        : content.displayName;

      setConvenio(formattedConvenio);
    }
  }, [content]);

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
  if (!data || data.length === 0) return <p>No hay datos disponibles.</p>;

  return (
    <div className="py-2">
      <Card>
        <CardContent className="space-y-6">
          {/* Input convenio y lista de convenios adicionales */}
          <div className="mb-6 space-y-4">
            <ConvenioField
              value={convenio}
              onOpenDialog={() => setOpenConvenioDialog(true)}
            />

            <ConvenioDialog
              open={openConvenioDialog}
              onOpenChange={setOpenConvenioDialog}
              jwtToken={document.cookie.replace("jwtToken=", "")}
              onSelect={(accountCode, displayName) => {
                const formattedValue = accountCode
                  ? `${accountCode} - ${displayName}`
                  : displayName;
                setConvenio(formattedValue);
                setOpenConvenioDialog(false);
              }}
            />
          </div>
          {data.map((item, index) => (
            <div key={index}>
              {/* Fecha y hora de viaje */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha y Hora </label>
                <Input value={item.pickupDueTime || ""} readOnly />
              </div>
              {/* Nombre de pasajero */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pasajero</label>
                <Input value={item.nombrePasajero || ""} readOnly />
              </div>
              {/* Telefono de pasajero  */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefono</label>
                <Input value={item.Telefono || ""} readOnly />
              </div>
              {/* Centro de costo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Centro de costo</label>
                <Input value={item["Centro de Costo"] || ""} readOnly />
              </div>

              {/* Origen Muestra */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Origen</label>
                <Input value={item.pickup.text || ""} readOnly />
              </div>

              {/* Destino Muestra */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Destino</label>
                <Input value={item.destination.text || ""} readOnly />
              </div>

              {/* Nota Conductor */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nota Central</label>
                <Textarea value={item.nota || ""} readOnly />
              </div>
            </div>
          ))}

          {/* Botones de guardar o otro boton */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1">Guardar</Button>
            <Button variant="outline" className="flex-1">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
