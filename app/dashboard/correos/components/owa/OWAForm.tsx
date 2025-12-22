"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
   PROPS
======================= */

interface OWAFormProps {
  rowId: string; // ID interno (BD)
  emailData?: any; // ID real de Microsoft Graph
}

/* =======================
   Component
======================= */

export default function OWAForm({ emailData }: OWAFormProps) {
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

  // ✅ Console log del emailId
  console.log("ReplyButton emailId FormRESERVA:", emailData?.id);

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
     Guardar / Booking
  ======================= */

  const handleGuardar = async (item: MensajeIAItem) => {
    setSaving(true);

    const json = {
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
    };

    try {
      await axios.post("/api/ghost/bookings/create", json);

      const booking = getCookie("bookingNumber");
      setBookingNumber(booking);

      setShowResultDialog(true);
    } catch (err) {
      console.error(err);
      alert("Error al crear la reserva");
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     Acciones Dialog
  ======================= */

  async function handleNoInformar() {
    if (isProcessingNoInform) return;

    setIsProcessingNoInform(true);

    try {
      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${rowId}`,
        { estado: 2 }
      );

      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.error("Error actualizando estado:", error);
    } finally {
      clearBookingCookie();
      window.location.href = "/dashboard/correos";
    }
  }

  /* =======================
     Render
  ======================= */

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-6 w-56" />
      </div>
    );
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="py-2 space-y-4">
      <Dialog open={showResultDialog}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="sm:max-w-md"
        >
          {!isProcessingNoInform ? (
            <>
              <DialogHeader>
                <DialogTitle>Reserva creada correctamente</DialogTitle>
              </DialogHeader>

              {bookingNumber && (
                <div className="flex justify-center py-4">
                  <div className="w-full rounded-lg border bg-muted/40 p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Número de reserva
                    </p>
                    <p className="text-3xl font-bold tracking-wider">
                      {bookingNumber}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                ¿Deseas informar esta reserva al cliente?
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={handleNoInformar}
                >
                  No informar
                </Button>

                {/* 👇 AQUÍ está la clave */}
                <InformarButton emailId={emailData?.id} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <Loader2 className="h-14 w-14 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Completando reserva</h3>
              <p className="text-sm text-muted-foreground">
                Volviendo a la lista de correos…
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

              <Input value={item.nombrePasajero ?? ""} readOnly />
              <Input value={item.Telefono ?? ""} readOnly />
              <Input value={item["Centro de Costo"] ?? ""} readOnly />

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

              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
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
