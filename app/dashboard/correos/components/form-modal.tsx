"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ChevronLeftIcon } from "lucide-react";

import ConvenioField from "./fields/ConvenioField";
import ConvenioDialog from "./fields/ConvenioDialog";
import DireccionField from "./fields/DireccionField";
import FechaField from "./fields/FechaField";

interface contentItem {
  accountIA: number | null;
  accountCode: number | null;
  displayName: string;
}

interface MensajeIAItem {
  nota: string;
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
}

interface ApiResponse {
  content: string;
  idCorreo: number;
  mensaje_ia: string;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData?: any;
}

export default function FormModal({
  isOpen,
  onClose,
  emailData,
}: FormModalProps) {
  const [data, setData] = useState<MensajeIAItem[] | null>(null);
  const [content, setContent] = useState<contentItem | null>(null);
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

  const [previewJson, setPreviewJson] = useState<any | null>(null);
  const [nota, setNota] = useState("");

  const [origen, setOrigen] = useState({ text: "", latitud: 0, longitud: 0 });
  const [destino, setDestino] = useState({ text: "", latitud: 0, longitud: 0 });

  const [pickupDueTime, setPickupDueTime] = useState("");

  // Obtener el ID desde emailData o props
  const id = emailData?.id || emailData?.idCorreo;

  // Traer datos de la API
  useEffect(() => {
    if (!isOpen || !id) return;

    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get<ApiResponse>(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/bodys/detalle/${id}`,
          { withCredentials: true }
        );

        const parsedIA = JSON.parse(res.data.mensaje_ia);
        const parsedArray = Array.isArray(parsedIA) ? parsedIA : [parsedIA];
        setData(parsedArray);

        const parsedContent = JSON.parse(res.data.content);
        setContent(parsedContent);

        setNota(parsedArray[0]?.nota || "");
        setPickupDueTime(parsedArray[0]?.pickupDueTime || "");

        const formattedConvenio = parsedContent.accountCode
          ? `${parsedContent.accountCode} - ${parsedContent.displayName}`
          : parsedContent.displayName;
        setConvenio(formattedConvenio);
        setSelectedAccountCode(parsedContent.accountCode);
        setSelectedDisplayName(parsedContent.displayName);
      } catch (err) {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isOpen]);

  // Genera JSON al presionar guardar
  const handleGuardar = (item: MensajeIAItem) => {
    const json = {
      pickupDueTime: pickupDueTime,
      name: item.nombrePasajero,
      telephoneNumber: item.Telefono,
      displayName: selectedDisplayName || content?.displayName,
      accountCode: selectedAccountCode,
      pickup: {
        address: {
          text: origen.text || item.pickup.text,
          coordinate: {
            latitude: origen.latitud || item.pickup.latitud,
            longitude: origen.longitud || item.pickup.longitud,
          },
          street: origen.text || item.pickup.text,
        },
      },
      destination: {
        address: {
          text: destino.text || item.destination.text,
          coordinate: {
            latitude: destino.latitud || item.destination.latitud,
            longitude: destino.longitud || item.destination.longitud,
          },
          street: destino.text || item.destination.text,
        },
        note: nota,
        passengerDetailsIndex: 0,
        type: "Destination",
      },
      driverNote: nota,
    };

    setPreviewJson(json);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-7xl">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[200px] rounded-lg border md:min-w-[450px]"
        >
          <ResizablePanel defaultSize={50}>
            <DialogHeader className="contents space-y-0 text-left">
              <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                <DialogTitle className="px-6 pt-6 text-2xl font-bold">
                  Procesar Correo
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="py-4 space-y-4">
                    {loading && (
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-6 w-72" />
                        <Skeleton className="h-6 w-56" />
                      </div>
                    )}

                    {error && <p className="text-red-500">{error}</p>}

                    {!loading && data && data.length > 0 && (
                      <div className="space-y-6 px-6 pb-6">
                        {previewJson && (
                          <pre className="bg-black text-green-400 p-4 text-xs rounded overflow-auto max-h-96">
                            {JSON.stringify(previewJson, null, 2)}
                          </pre>
                        )}

                        {/* Convenio */}
                        <div className="space-y-4">
                          <ConvenioField
                            value={convenio || ""}
                            onOpenDialog={() => setOpenConvenioDialog(true)}
                          />

                          <ConvenioDialog
                            open={openConvenioDialog}
                            onOpenChange={setOpenConvenioDialog}
                            onSelect={(accountCode, displayName) => {
                              setSelectedAccountCode(accountCode);
                              setSelectedDisplayName(displayName);
                              const formatted = accountCode
                                ? `${accountCode} - ${displayName}`
                                : displayName;
                              setConvenio(formatted);
                              setOpenConvenioDialog(false);
                            }}
                          />
                        </div>

                        {/* Datos del mensaje */}
                        {data.map((item, index) => (
                          <div key={index} className="space-y-4">
                            <FechaField
                              value={pickupDueTime}
                              onChange={setPickupDueTime}
                            />

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Pasajero
                              </label>
                              <Input
                                value={item.nombrePasajero || ""}
                                readOnly
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Telefono
                              </label>
                              <Input value={item.Telefono || ""} readOnly />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Centro de costo
                              </label>
                              <Input
                                value={item["Centro de Costo"] || ""}
                                readOnly
                              />
                            </div>

                            <DireccionField
                              label="Origen"
                              initialValue={item.pickup.text}
                              onSelect={(data) =>
                                setOrigen({
                                  text: data.text,
                                  latitud: data.lat,
                                  longitud: data.lng,
                                })
                              }
                            />

                            <DireccionField
                              label="Destino"
                              initialValue={item.destination.text}
                              onSelect={(data) =>
                                setDestino({
                                  text: data.text,
                                  latitud: data.lat,
                                  longitud: data.lng,
                                })
                              }
                            />

                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Nota Central
                              </label>
                              <Textarea
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                placeholder="Ingrese nota"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!loading && (!data || data.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        No hay datos disponibles.
                      </p>
                    )}
                  </div>
                </DialogDescription>
              </ScrollArea>
            </DialogHeader>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">
                {" "}
                MAPA CON PUNTOS DE UBICACION
              </span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        <DialogFooter className="flex-row items-center justify-end border-t px-6 py-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-6 w-56" />
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          {!loading && data && data.length > 0 && (
            <>
              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => handleGuardar(data[0])}
                >
                  Guardar
                </Button>
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </>
          )}

          {!loading && (!data || data.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No hay datos disponibles.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
