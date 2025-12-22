"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ConvenioField from "../fields/ConvenioField";
import ConvenioDialog from "../fields/ConvenioDialog";
import DireccionField from "../fields/DireccionField";
import FechaField from "../fields/FechaField";

import { InformarButton } from "../owa-actions/InformarButton";
import { Loader2 } from "lucide-react";

/* =======================
   Helpers
======================= */

function toChileISOString(dateString: string) {
  const [datePart, timePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const isSummerTime = new Date()
    .toLocaleString("en-US", {
      timeZone: "America/Santiago",
      timeZoneName: "short",
    })
    .includes("GMT-3");

  const offset = isSummerTime ? "-03:00" : "-04:00";
  return `${year}-${month}-${day}T${hour}:${minute}:00${offset}`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearBookingCookie() {
  document.cookie =
    "bookingNumber=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/* =======================
   Interfaces
======================= */

interface MensajeIAItem {
  nota: string;
  pickup: {
    text: string;
    latitud: number;
    longitud: number;
  };
  destination: {
    text: string;
    latitud: number;
    longitud: number;
  };
  pickupDueTime: string;
  nombrePasajero: string | null;
  Telefono: string | null;
  "Centro de Costo": string | null;
}

interface ApiResponse {
  content: string;
  mensaje_ia: string;
}

/* =======================
   Component
======================= */

export default function OWAForm({ emailData }: { emailData?: any }) {
  const params = useParams<{ id: string }>();
  const rowId = params.id;

  const [data, setData] = useState<MensajeIAItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [convenio, setConvenio] = useState("");
  const [selectedAccountCode, setSelectedAccountCode] = useState<string | null>(
    null
  );
  const [selectedDisplayName, setSelectedDisplayName] = useState<string | null>(
    null
  );
  const [openConvenioDialog, setOpenConvenioDialog] = useState(false);

  const [nota, setNota] = useState("");
  const [origen, setOrigen] = useState({ text: "", latitud: 0, longitud: 0 });
  const [destino, setDestino] = useState({ text: "", latitud: 0, longitud: 0 });
  const [pickupDueTime, setPickupDueTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isProcessingNoInform, setIsProcessingNoInform] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);

  /* =======================
     Fetch inicial
  ======================= */

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get<ApiResponse>(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/bodys/detalle/${rowId}`,
          { withCredentials: true }
        );

        const parsedIA = JSON.parse(res.data.mensaje_ia);
        const parsedArray = Array.isArray(parsedIA) ? parsedIA : [parsedIA];

        setData(parsedArray);
        setNota(parsedArray[0]?.nota ?? "");
        setPickupDueTime(parsedArray[0]?.pickupDueTime ?? "");

        const parsedContent = JSON.parse(res.data.content);
        setSelectedAccountCode(parsedContent?.accountCode ?? null);
        setSelectedDisplayName(parsedContent?.displayName ?? null);

        setConvenio(
          parsedContent?.accountCode && parsedContent?.displayName
            ? `${parsedContent.accountCode} - ${parsedContent.displayName}`
            : parsedContent?.displayName ?? ""
        );
      } catch {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [rowId]);

  /* =======================
     Helpers edición
  ======================= */

  function updateItem(index: number, field: keyof MensajeIAItem, value: any) {
    setData((prev) =>
      prev
        ? prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
          )
        : prev
    );
  }

  /* =======================
     Guardar
  ======================= */

  const handleGuardar = async (item: MensajeIAItem) => {
    setSaving(true);

    try {
      await axios.post("/api/ghost/bookings/create", {
        companyId: 1,
        paymentType: "Account",
        pickupDueTime: toChileISOString(pickupDueTime),
        name: item.nombrePasajero ?? "",
        passengers: 1,
        telephoneNumber: item.Telefono ?? "",
        customerId: 144,
        accountType: "Account",
        displayName: selectedDisplayName,
        accountCode: selectedAccountCode,
        driverNote: nota,
        officeNote: "SERV. POR SISTEMA OWA",
        priority: 5,
        pickup: {
          address: {
            text: origen.text || item.pickup.text,
            coordinate: {
              latitude: origen.latitud || item.pickup.latitud,
              longitude: origen.longitud || item.pickup.longitud,
            },
          },
          type: "Pickup",
        },
        destination: {
          address: {
            text: destino.text || item.destination.text,
            coordinate: {
              latitude: destino.latitud || item.destination.latitud,
              longitude: destino.longitud || item.destination.longitud,
            },
          },
          type: "Destination",
        },
        hold: true,
      });

      setBookingNumber(getCookie("bookingNumber"));
      setShowResultDialog(true);
    } catch {
      alert("Error al crear la reserva");
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     Render
  ======================= */

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="py-2 space-y-4">
      <Card>
        <CardContent className="space-y-6">
          <ConvenioField
            value={convenio}
            onOpenDialog={() => setOpenConvenioDialog(true)}
          />

          <ConvenioDialog
            open={openConvenioDialog}
            onOpenChange={setOpenConvenioDialog}
            onSelect={(code, name) => {
              setSelectedAccountCode(code);
              setSelectedDisplayName(name);
              setConvenio(code ? `${code} - ${name}` : name);
            }}
          />

          {data.map((item, index) => (
            <div key={index} className="space-y-4">
              <FechaField value={pickupDueTime} onChange={setPickupDueTime} />

              <div className="grid gap-3">
                <Label>Pasajero</Label>
                <Input
                  value={item.nombrePasajero ?? ""}
                  onChange={(e) =>
                    updateItem(index, "nombrePasajero", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label>Teléfono</Label>
                <Input
                  value={item.Telefono ?? ""}
                  onChange={(e) =>
                    updateItem(index, "Telefono", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label>Centro de costo</Label>
                <Input
                  value={item["Centro de Costo"] ?? ""}
                  onChange={(e) =>
                    updateItem(index, "Centro de Costo", e.target.value)
                  }
                />
              </div>

              <DireccionField
                label="Origen"
                initialValue={item.pickup.text}
                onSelect={(d) =>
                  setOrigen({ text: d.text, latitud: d.lat, longitud: d.lng })
                }
              />

              <DireccionField
                label="Destino"
                initialValue={item.destination.text}
                onSelect={(d) =>
                  setDestino({ text: d.text, latitud: d.lat, longitud: d.lng })
                }
              />

              <div className="grid gap-3">
                <Label>Nota al Conductor</Label>
                <Textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </div>
            </div>
          ))}

          <Button onClick={() => handleGuardar(data[0])} disabled={saving}>
            {saving ? "Creando..." : "Crear Reserva"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
