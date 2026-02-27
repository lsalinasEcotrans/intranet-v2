"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck, Upload, Download, Zap, AlertCircle } from "lucide-react";

interface Suggestion {
  description: string;
  place_id: string | null;
  fullAddress?: any;
  customAddressID?: number | null;
  coordinate?: { latitude: number; longitude: number };
}

interface PasajeroRow {
  rut: string;
  grupo_numero: string;
  nombre: string;
  contacto: string | null;
  rol: string;
  turno: string;
  centro_costo: string;
  direccion_origen: string;
  direccion_destino: string;
  hora_programada: string | number;
  origenSuggestions?: Suggestion[];
  destinoSuggestions?: Suggestion[];
  latOrigen?: number;
  lngOrigen?: number;
  latDestino?: number;
  lngDestino?: number;
}

export default function CargaMasivaPasajeros() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PasajeroRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState<any[]>([]);

  const formatHora = (excelNum: number | string) => {
    if (typeof excelNum === "string") return excelNum;
    const totalMinutes = Math.round(excelNum * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  const fetchSuggestions = async (text: string) => {
    try {
      const res = await axios.get(
        `/api/ghost/autocomplete?text=${encodeURIComponent(text)}`,
      );
      return (
        res.data?.searchResults?.map((item: any) => ({
          description: item.address,
          place_id: item.placeID,
          fullAddress: item.fullAddress,
          customAddressID: item.customAddressID,
          coordinate: item.fullAddress?.coordinate,
        })) || []
      );
    } catch (err) {
      console.error("Error autocomplete:", err);
      toast.error("Error buscando alternativas de dirección");
      return [];
    }
  };

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const parsedRows: PasajeroRow[] = [];
        setLoading(true);

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const newRow: PasajeroRow = {
            rut: row.rut?.toString() ?? "",
            grupo_numero: row.grupo_numero ?? "",
            nombre: row.nombre ?? "",
            contacto: row.contacto ?? "",
            rol: row.rol ?? "",
            turno: row.turno ?? "",
            centro_costo: row.centro_costo ?? "",
            direccion_origen: row.direccion_origen ?? "",
            direccion_destino: row.direccion_destino ?? "",
            hora_programada: row.hora_programada ?? "",
          };

          const origenResults = await fetchSuggestions(newRow.direccion_origen);
          if (origenResults.length > 0) {
            const firstOrigen = origenResults[0];
            if (firstOrigen.coordinate) {
              newRow.latOrigen = firstOrigen.coordinate.latitude;
              newRow.lngOrigen = firstOrigen.coordinate.longitude;
            } else {
              newRow.origenSuggestions = origenResults;
            }
          }

          const destinoResults = await fetchSuggestions(
            newRow.direccion_destino,
          );
          if (destinoResults.length > 0) {
            const firstDestino = destinoResults[0];
            if (firstDestino.coordinate) {
              newRow.latDestino = firstDestino.coordinate.latitude;
              newRow.lngDestino = firstDestino.coordinate.longitude;
            } else {
              newRow.destinoSuggestions = destinoResults;
            }
          }

          parsedRows.push(newRow);
        }

        setRows(parsedRows);
        setLoading(false);
      };

      reader.readAsBinaryString(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleSelectSuggestion = async (
    rowIndex: number,
    suggestion: Suggestion,
    type: "origen" | "destino",
  ) => {
    let lat: number | null = null;
    let lng: number | null = null;

    if (suggestion.coordinate) {
      lat = suggestion.coordinate.latitude;
      lng = suggestion.coordinate.longitude;
    } else if (suggestion.place_id) {
      try {
        const res = await axios.get(
          `/api/ghost/details?placeID=${encodeURIComponent(suggestion.place_id)}`,
        );
        lat = res.data?.coordinate?.latitude;
        lng = res.data?.coordinate?.longitude;
      } catch (err) {
        console.error("Error details:", err);
        toast.error("No se pudieron obtener coordenadas de la alternativa");
        return;
      }
    }

    setRows((prev) => {
      const newRows = [...prev];
      if (type === "origen") {
        newRows[rowIndex].latOrigen = lat ?? undefined;
        newRows[rowIndex].lngOrigen = lng ?? undefined;
        newRows[rowIndex].origenSuggestions = [];
      } else {
        newRows[rowIndex].latDestino = lat ?? undefined;
        newRows[rowIndex].lngDestino = lng ?? undefined;
        newRows[rowIndex].destinoSuggestions = [];
      }
      return newRows;
    });
  };

  useEffect(() => {
    const preview = rows.map((row) => ({
      rut: String(row.rut),
      grupo_numero: Number(row.grupo_numero),
      nombre: row.nombre,
      contacto: String(row.contacto),
      rol: row.rol,
      turno: row.turno,
      centro_costo: row.centro_costo?.trim() ? row.centro_costo : "null",
      direccion_origen: row.direccion_origen,
      latitud_origen: row.latOrigen ?? 0,
      longitud_origen: row.lngOrigen ?? 0,
      hora_programada: formatHora(row.hora_programada),
      direccion_destino: row.direccion_destino,
      latitud_destino: row.latDestino ?? 0,
      longitud_destino: row.lngDestino ?? 0,
    }));
    setPayloadPreview(preview);
  }, [rows]);

  const handleSendToAPI = async () => {
    setLoading(true);
    const batchSize = 3;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const payloadBatch = batch.map((row) => ({
        rut: String(row.rut),
        grupo_numero: Number(row.grupo_numero),
        nombre: row.nombre,
        contacto: String(row.contacto),
        rol: row.rol,
        turno: row.turno,
        centro_costo: row.centro_costo?.trim() ? row.centro_costo : "null",
        direccion_origen: row.direccion_origen,
        latitud_origen: row.latOrigen ?? 0,
        longitud_origen: row.lngOrigen ?? 0,
        hora_programada: formatHora(row.hora_programada),
        direccion_destino: row.direccion_destino,
        latitud_destino: row.latDestino ?? 0,
        longitud_destino: row.lngDestino ?? 0,
      }));

      try {
        await Promise.all(
          payloadBatch.map((p) =>
            axios.post(
              "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros/",
              p,
            ),
          ),
        );
      } catch (err) {
        console.error("Error enviando batch:", err);
        toast.error("Error enviando algunos pasajeros");
      }
    }

    toast.success("Todos los pasajeros enviados correctamente");
    setLoading(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        rut: "123456789",
        grupo_numero: 100,
        nombre: "Juan Pérez",
        contacto: "987654321",
        rol: "OPERARIO",
        turno: "4x4",
        centro_costo: "CC001",
        direccion_origen: "GRAN AVENIDA 1234, LA CISTERNA",
        direccion_destino: "LAS PUERTAS",
        hora_programada: "05:30",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_carga_pasajeros.xlsx");

    toast.success("Plantilla descargada correctamente");
  };

  const completedCount = rows.filter(
    (row) => row.latOrigen && row.lngOrigen && row.latDestino && row.lngDestino,
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* <div className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">
            Carga Masiva de Pasajeros
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Gestiona la carga y procesamiento de datos de pasajeros desde
            archivos Excel
          </p>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Step 1: Upload */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Cargar Archivo
            </h2>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Sube un archivo Excel con los datos de los pasajeros
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Cargar Excel
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              size="lg"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Step 2: Preview & Process */}
        {rows.length > 0 && (
          <>
            <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Verificar Direcciones
                </h2>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Total de Registros
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {rows.length}
                  </p>
                </div>

                <div className="rounded-lg bg-accent/10 p-4">
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="mt-1 text-2xl font-bold text-accent">
                    {completedCount}
                  </p>
                </div>

                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="mt-1 text-2xl font-bold text-destructive">
                    {rows.length - completedCount}
                  </p>
                </div>
              </div>

              {/* Scroll Table */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        RUT
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Origen
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Alternativas Origen
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Destino
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Alternativas Destino
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">
                        Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground font-medium">
                          {row.rut}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {row.nombre}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {row.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.direccion_origen.length > 30
                            ? row.direccion_origen.substring(0, 30) + "..."
                            : row.direccion_origen}
                        </td>
                        <td className="px-4 py-3">
                          {row.origenSuggestions?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {row.origenSuggestions.map((s) => (
                                <Button
                                  key={s.place_id || s.description}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSelectSuggestion(idx, s, "origen")
                                  }
                                  className="text-xs"
                                >
                                  {s.description.length > 20
                                    ? s.description.substring(0, 20) + "..."
                                    : s.description}
                                </Button>
                              ))}
                            </div>
                          ) : row.latOrigen && row.lngOrigen ? (
                            <div className="flex items-center gap-1 text-accent">
                              <CheckCheck className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Verificado
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Pendiente
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.direccion_destino.length > 30
                            ? row.direccion_destino.substring(0, 30) + "..."
                            : row.direccion_destino}
                        </td>
                        <td className="px-4 py-3">
                          {row.destinoSuggestions?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {row.destinoSuggestions.map((s) => (
                                <Button
                                  key={s.place_id || s.description}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSelectSuggestion(idx, s, "destino")
                                  }
                                  className="text-xs"
                                >
                                  {s.description.length > 20
                                    ? s.description.substring(0, 20) + "..."
                                    : s.description}
                                </Button>
                              ))}
                            </div>
                          ) : row.latDestino && row.lngDestino ? (
                            <div className="flex items-center gap-1 text-accent">
                              <CheckCheck className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Verificado
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Pendiente
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground font-medium">
                          {formatHora(row.hora_programada)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3: Send to API */}
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Enviar a API
                </h2>
              </div>

              <p className="mb-6 text-sm text-muted-foreground">
                Asegúrate de que todos los registros estén verificados antes de
                enviar
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  onClick={handleSendToAPI}
                  disabled={
                    loading ||
                    rows.length === 0 ||
                    completedCount !== rows.length
                  }
                  size="lg"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar a API"}
                </Button>

                {loading && (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="font-medium">Procesando...</span>
                  </div>
                )}
              </div>

              {completedCount !== rows.length && rows.length > 0 && (
                <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">
                    ⚠️ Completa la verificación de todas las direcciones antes
                    de enviar
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
