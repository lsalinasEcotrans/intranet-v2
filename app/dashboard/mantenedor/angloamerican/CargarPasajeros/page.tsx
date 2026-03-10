"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck, Upload, Download, Zap, AlertCircle, Pencil, X } from "lucide-react";

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
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [retryingRows, setRetryingRows] = useState<Set<string>>(new Set());
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

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
        setProgress({ current: 0, total: jsonData.length });

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
          setProgress({ current: i + 1, total: jsonData.length });
        }

        setRows(parsedRows);
        setLoading(false);
        setProgress({ current: 0, total: 0 });
      };

      reader.readAsBinaryString(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleRetry = async (
    rowIndex: number,
    type: "origen" | "destino",
  ) => {
    const row = rows[rowIndex];
    const address =
      type === "origen" ? row.direccion_origen : row.direccion_destino;
    const key = `${rowIndex}-${type}`;

    setRetryingRows((prev) => new Set(prev).add(key));

    const results = await fetchSuggestions(address);

    setRows((prev) => {
      const newRows = [...prev];
      if (results.length > 0) {
        const first = results[0];
        if (first.coordinate) {
          if (type === "origen") {
            newRows[rowIndex].latOrigen = first.coordinate.latitude;
            newRows[rowIndex].lngOrigen = first.coordinate.longitude;
            newRows[rowIndex].origenSuggestions = [];
          } else {
            newRows[rowIndex].latDestino = first.coordinate.latitude;
            newRows[rowIndex].lngDestino = first.coordinate.longitude;
            newRows[rowIndex].destinoSuggestions = [];
          }
        } else {
          if (type === "origen") {
            newRows[rowIndex].origenSuggestions = results;
          } else {
            newRows[rowIndex].destinoSuggestions = results;
          }
        }
      } else {
        toast.error(`No se encontraron resultados para: ${address}`);
      }
      return newRows;
    });

    setRetryingRows((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleSaveEdit = async (
    rowIndex: number,
    type: "origen" | "destino",
  ) => {
    const key = `${rowIndex}-${type}`;
    const newAddress = editingFields[key]?.trim();
    if (!newAddress) return;

    // Update the address in the row
    setRows((prev) => {
      const newRows = [...prev];
      if (type === "origen") {
        newRows[rowIndex].direccion_origen = newAddress;
      } else {
        newRows[rowIndex].direccion_destino = newAddress;
      }
      return newRows;
    });

    // Clear edit mode and retry with new address
    setEditingFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setRetryingRows((prev) => new Set(prev).add(key));

    const results = await fetchSuggestions(newAddress);

    setRows((prev) => {
      const newRows = [...prev];
      if (results.length > 0) {
        const first = results[0];
        if (first.coordinate) {
          if (type === "origen") {
            newRows[rowIndex].latOrigen = first.coordinate.latitude;
            newRows[rowIndex].lngOrigen = first.coordinate.longitude;
            newRows[rowIndex].origenSuggestions = [];
          } else {
            newRows[rowIndex].latDestino = first.coordinate.latitude;
            newRows[rowIndex].lngDestino = first.coordinate.longitude;
            newRows[rowIndex].destinoSuggestions = [];
          }
        } else {
          if (type === "origen") {
            newRows[rowIndex].origenSuggestions = results;
          } else {
            newRows[rowIndex].destinoSuggestions = results;
          }
        }
      } else {
        toast.error(`No se encontraron resultados para: ${newAddress}`);
      }
      return newRows;
    });

    setRetryingRows((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

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
    setSendProgress({ current: 0, total: rows.length });
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

      setSendProgress((prev) => ({
        ...prev,
        current: Math.min(i + batchSize, rows.length),
      }));
    }

    toast.success("Todos los pasajeros enviados correctamente");
    setLoading(false);
    setSendProgress({ current: 0, total: 0 });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        rut: "123456789",
        grupo_numero: 100,
        nombre: "Juan Pérez",
        contacto: "987654321",
        rol: "OPERARIO",
        turno: "TurnoH",
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

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background">
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
              disabled={loading}
            >
              <Upload className="h-4 w-4" />
              Cargar Excel
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              size="lg"
              className="gap-2"
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </Button>
          </div>

          {/* Banner cuando se está enviando a la API */}
          {loading && sendProgress.total > 0 && (
            <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/40 dark:bg-orange-900/10">
              <div className="flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                Enviando pasajeros a la API... No cargues un nuevo archivo hasta que termine.
              </div>
            </div>
          )}

          {/* Loader con progreso de procesamiento */}
          {loading && progress.total > 0 && (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium text-primary">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Procesando direcciones...
                </div>
                <span className="text-muted-foreground">
                  {progress.current} / {progress.total} ({progressPercent}%)
                </span>
              </div>
              {/* Barra de progreso */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Buscando coordenadas para origen y destino de cada pasajero...
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Step 2: Preview & Process */}
        {rows.length > 0 && !loading && (
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
                        className="transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
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
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                              {row.origenSuggestions.map((s) => (
                                <Button
                                  key={s.place_id || s.description}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSelectSuggestion(idx, s, "origen")
                                  }
                                  className="h-auto w-full justify-start whitespace-normal py-1.5 text-left text-xs leading-tight"
                                >
                                  {s.description}
                                </Button>
                              ))}
                            </div>
                          ) : row.latOrigen && row.lngOrigen ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCheck className="h-3.5 w-3.5" />
                              Verificado
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Pendiente
                              </span>

                              {/* Modo edición */}
                              {editingFields[`${idx}-origen`] !== undefined ? (
                                <div className="flex flex-col gap-1.5 min-w-[220px]">
                                  <input
                                    autoFocus
                                    value={editingFields[`${idx}-origen`]}
                                    onChange={(e) =>
                                      setEditingFields((prev) => ({
                                        ...prev,
                                        [`${idx}-origen`]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit(idx, "origen");
                                      if (e.key === "Escape")
                                        setEditingFields((prev) => {
                                          const next = { ...prev };
                                          delete next[`${idx}-origen`];
                                          return next;
                                        });
                                    }}
                                    placeholder="Escribe la dirección..."
                                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(idx, "origen")}
                                      disabled={!editingFields[`${idx}-origen`]?.trim()}
                                      className="h-auto flex-1 py-1 text-xs"
                                    >
                                      Buscar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setEditingFields((prev) => {
                                          const next = { ...prev };
                                          delete next[`${idx}-origen`];
                                          return next;
                                        })
                                      }
                                      className="h-auto px-2 py-1 text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={retryingRows.has(`${idx}-origen`)}
                                    onClick={() => handleRetry(idx, "origen")}
                                    className="h-auto gap-1.5 py-1 text-xs"
                                  >
                                    {retryingRows.has(`${idx}-origen`) ? (
                                      <>
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Buscando...
                                      </>
                                    ) : (
                                      <>🔄 Reintentar</>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingFields((prev) => ({
                                        ...prev,
                                        [`${idx}-origen`]: rows[idx].direccion_origen,
                                      }))
                                    }
                                    className="h-auto gap-1 py-1 text-xs"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                  </Button>
                                </div>
                              )}
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
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                              {row.destinoSuggestions.map((s) => (
                                <Button
                                  key={s.place_id || s.description}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleSelectSuggestion(idx, s, "destino")
                                  }
                                  className="h-auto w-full justify-start whitespace-normal py-1.5 text-left text-xs leading-tight"
                                >
                                  {s.description}
                                </Button>
                              ))}
                            </div>
                          ) : row.latDestino && row.lngDestino ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCheck className="h-3.5 w-3.5" />
                              Verificado
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Pendiente
                              </span>

                              {/* Modo edición */}
                              {editingFields[`${idx}-destino`] !== undefined ? (
                                <div className="flex flex-col gap-1.5 min-w-[220px]">
                                  <input
                                    autoFocus
                                    value={editingFields[`${idx}-destino`]}
                                    onChange={(e) =>
                                      setEditingFields((prev) => ({
                                        ...prev,
                                        [`${idx}-destino`]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit(idx, "destino");
                                      if (e.key === "Escape")
                                        setEditingFields((prev) => {
                                          const next = { ...prev };
                                          delete next[`${idx}-destino`];
                                          return next;
                                        });
                                    }}
                                    placeholder="Escribe la dirección..."
                                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(idx, "destino")}
                                      disabled={!editingFields[`${idx}-destino`]?.trim()}
                                      className="h-auto flex-1 py-1 text-xs"
                                    >
                                      Buscar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setEditingFields((prev) => {
                                          const next = { ...prev };
                                          delete next[`${idx}-destino`];
                                          return next;
                                        })
                                      }
                                      className="h-auto px-2 py-1 text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={retryingRows.has(`${idx}-destino`)}
                                    onClick={() => handleRetry(idx, "destino")}
                                    className="h-auto gap-1.5 py-1 text-xs"
                                  >
                                    {retryingRows.has(`${idx}-destino`) ? (
                                      <>
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Buscando...
                                      </>
                                    ) : (
                                      <>🔄 Reintentar</>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingFields((prev) => ({
                                        ...prev,
                                        [`${idx}-destino`]: rows[idx].direccion_destino,
                                      }))
                                    }
                                    className="h-auto gap-1 py-1 text-xs"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
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
              </div>

              {/* Barra de progreso de envío */}
              {loading && sendProgress.total > 0 && (
                <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Enviando pasajeros...
                    </div>
                    <span className="text-muted-foreground">
                      {sendProgress.current} / {sendProgress.total} (
                      {Math.round(
                        (sendProgress.current / sendProgress.total) * 100,
                      )}
                      %)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.round((sendProgress.current / sendProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    No cierres esta ventana hasta que el proceso termine...
                  </p>
                </div>
              )}

              {completedCount !== rows.length && rows.length > 0 && !loading && (
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