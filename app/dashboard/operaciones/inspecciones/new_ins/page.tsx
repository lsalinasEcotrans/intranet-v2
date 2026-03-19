"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ecotrans-intranet-370980788525.europe-west1.run.app";

// ─── Types ────────────────────────────────────────────────────────────────────
type ProgressValue = 0 | 25 | 50 | 75 | 100;
type CarroceriaValue = "Bueno" | "Regular" | "Malo" | "";

interface InspeccionForm {
  kilometraje: string;
  proximaMantencion: string;
  extintorFecha: string;
  cinturonDelantero: boolean;
  cinturonTrasero: boolean;
  chalecoReflectante: boolean;
  botiquin: boolean;
  ruedaRepuesto: boolean;
  triangulosEmergencia: boolean;
  neumaticos: ProgressValue;
  frenos: ProgressValue;
  carroceria: CarroceriaValue;
  luzPatenteTransera: boolean;
  lucesIntermitentes: boolean;
  lucesEstacionamiento: boolean;
  lucesFrenos: boolean;
  lucesMarchaAtras: boolean;
  lucesBajas: boolean;
  lucesAltas: boolean;
  observaciones: string;
}

interface SubmitResult {
  id: number;
  estado: "aprobado" | "rechazado";
  motivo_rechazo: string | null;
  fecha_proxima: string;
  fotos_subidas: number;
}

const PROGRESS_STEPS: ProgressValue[] = [0, 25, 50, 75, 100];

function progressColor(v: ProgressValue) {
  if (v <= 25) return "bg-destructive";
  if (v <= 50) return "bg-orange-500";
  if (v <= 75) return "bg-yellow-500";
  return "bg-green-500";
}
function progressTextColor(v: ProgressValue) {
  if (v <= 25) return "text-destructive";
  if (v <= 50) return "text-orange-500";
  if (v <= 75) return "text-yellow-500";
  return "text-green-500";
}

// ─── Progress Selector ────────────────────────────────────────────────────────
function ProgressSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ProgressValue;
  onChange: (v: ProgressValue) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span
          className={cn(
            "text-xs font-mono font-bold",
            progressTextColor(value),
          )}
        >
          {value}%
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
            progressColor(value),
          )}
          style={{ width: `${value}%` }}
        />
        {PROGRESS_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all duration-200 cursor-pointer z-10",
              value >= step
                ? cn(
                    "border-transparent",
                    progressColor(
                      step === 0 && value === 0
                        ? 0
                        : step <= value
                          ? value
                          : step,
                    ),
                  )
                : "border-border bg-background",
            )}
            style={{
              left: step === 100 ? "calc(100% - 8px)" : `calc(${step}% - 8px)`,
            }}
            title={`${step}%`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {PROGRESS_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              "text-[0.65rem] font-mono bg-transparent border-none cursor-pointer p-0 transition-colors",
              value === step
                ? cn("font-bold", progressTextColor(value))
                : "text-muted-foreground",
            )}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Carrocería Selector ──────────────────────────────────────────────────────
function CarroceriaSelector({
  value,
  onChange,
}: {
  value: CarroceriaValue;
  onChange: (v: CarroceriaValue) => void;
}) {
  const options: {
    label: CarroceriaValue;
    active: string;
    inactive: string;
  }[] = [
    {
      label: "Bueno",
      active:
        "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400",
      inactive: "border-border text-muted-foreground hover:border-green-500/50",
    },
    {
      label: "Regular",
      active:
        "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400",
      inactive:
        "border-border text-muted-foreground hover:border-orange-500/50",
    },
    {
      label: "Malo",
      active: "border-destructive bg-destructive/10 text-destructive",
      inactive:
        "border-border text-muted-foreground hover:border-destructive/50",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.label)}
          className={cn(
            "py-2.5 rounded-lg border-2 font-semibold text-sm transition-all duration-150 cursor-pointer bg-transparent",
            value === opt.label ? opt.active : opt.inactive,
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-150 cursor-pointer",
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border hover:border-primary/20 hover:bg-accent/30",
      )}
      onClick={() => onChange(!checked)}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        onClick={(e) => e.stopPropagation()}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm font-normal select-none"
      >
        {label}
      </Label>
    </div>
  );
}

// ─── Photo Upload ─────────────────────────────────────────────────────────────
function PhotoUpload({
  photos,
  onAdd,
  onRemove,
}: {
  photos: File[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onAdd(Array.from(files).filter((f) => f.type.startsWith("image/")));
  };
  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-accent/30",
        )}
      >
        <p className="text-2xl mb-2">📷</p>
        <p className="text-sm text-muted-foreground">
          Arrastra fotos aquí o{" "}
          <span className="text-primary underline underline-offset-2">
            haz clic para seleccionar
          </span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Se guardarán en OneDrive al enviar
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {photos.length > 0 && (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
          }}
        >
          {photos.map((file, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`foto-${i}`}
                className="w-full aspect-square object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[0.6rem] border-none cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Result Banner ────────────────────────────────────────────────────────────
function ResultBanner({ result }: { result: SubmitResult }) {
  const aprobado = result.estado === "aprobado";
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 space-y-2",
        aprobado
          ? "border-green-500/40 bg-green-500/10"
          : "border-destructive/40 bg-destructive/10",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{aprobado ? "✅" : "❌"}</span>
        <p
          className={cn(
            "font-bold text-sm",
            aprobado
              ? "text-green-600 dark:text-green-400"
              : "text-destructive",
          )}
        >
          Inspección {aprobado ? "APROBADA" : "RECHAZADA"} — ID #{result.id}
        </p>
      </div>
      {result.motivo_rechazo && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold">Motivos: </span>
          {result.motivo_rechazo}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Próxima inspección:{" "}
        <span className="font-mono font-medium">
          {new Date(result.fecha_proxima).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
        {result.fotos_subidas > 0 && (
          <>
            {" "}
            · {result.fotos_subidas} foto{result.fotos_subidas !== 1 ? "s" : ""}{" "}
            guardadas en OneDrive
          </>
        )}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NuevaInspeccionPage() {
  const [data, setData] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<InspeccionForm>({
    kilometraje: "",
    proximaMantencion: "",
    extintorFecha: "",
    cinturonDelantero: false,
    cinturonTrasero: false,
    chalecoReflectante: false,
    botiquin: false,
    ruedaRepuesto: false,
    triangulosEmergencia: false,
    neumaticos: 100,
    frenos: 100,
    carroceria: "",
    luzPatenteTransera: false,
    lucesIntermitentes: false,
    lucesEstacionamiento: false,
    lucesFrenos: false,
    lucesMarchaAtras: false,
    lucesBajas: false,
    lucesAltas: false,
    observaciones: "",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("inspeccion_data");
    if (stored) setData(JSON.parse(stored));
  }, []);

  const set = <K extends keyof InspeccionForm>(
    key: K,
    value: InspeccionForm[K],
  ) => setForm((p) => ({ ...p, [key]: value }));

  const seguridadFields: Array<keyof InspeccionForm> = [
    "cinturonDelantero",
    "cinturonTrasero",
    "chalecoReflectante",
    "botiquin",
    "ruedaRepuesto",
    "triangulosEmergencia",
  ];
  const seguridadAllChecked = seguridadFields.every((f) => form[f] === true);
  const seguridadSomeChecked = seguridadFields.some((f) => form[f] === true);
  const toggleAllSeguridad = () => {
    const val = !seguridadAllChecked;
    const patch: Partial<InspeccionForm> = {};
    seguridadFields.forEach((f) => {
      (patch as any)[f] = val;
    });
    setForm((p) => ({ ...p, ...patch }));
  };

  const lucesFields: Array<{ key: keyof InspeccionForm; label: string }> = [
    { key: "luzPatenteTransera", label: "Luz patente trasera" },
    { key: "lucesIntermitentes", label: "Luces intermitentes" },
    { key: "lucesEstacionamiento", label: "Luces estacionamiento" },
    { key: "lucesFrenos", label: "Luces de frenos" },
    { key: "lucesMarchaAtras", label: "Luces marcha atrás" },
    { key: "lucesBajas", label: "Luces bajas" },
    { key: "lucesAltas", label: "Luces altas" },
  ];
  const lucesKeys = lucesFields.map((f) => f.key);
  const lucesAllChecked = lucesKeys.every((k) => form[k] === true);
  const lucesSomeChecked = lucesKeys.some((k) => form[k] === true);
  const toggleAllLuces = () => {
    const val = !lucesAllChecked;
    const patch: Partial<InspeccionForm> = {};
    lucesKeys.forEach((k) => {
      (patch as any)[k] = val;
    });
    setForm((p) => ({ ...p, ...patch }));
  };

  // ── Submit real ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!data) return;
    setSubmitting(true);
    setSubmitResult(null);
    setSubmitError(null);

    try {
      const fd = new FormData();

      // Campos planos para índices BD
      fd.append("registration", data.vehiculo?.registration ?? "");
      fd.append("callsign", data.vehiculo?.callsign ?? "");
      fd.append("make", data.vehiculo?.make ?? "");
      fd.append("model", data.vehiculo?.model ?? "");
      fd.append("year_manufacture", data.vehiculo?.yearManufacture ?? "");
      fd.append("forename", data.driver?.forename ?? "");
      fd.append("surname", data.driver?.surname ?? "");
      fd.append("cpc_card_number", data.driver?.cpcCardNumber ?? "");

      // JSONs completos
      fd.append("datos_vehiculo", JSON.stringify(data.vehiculo ?? {}));
      fd.append("datos_conductor", JSON.stringify(data.driver ?? {}));
      fd.append("datos_inspeccion", JSON.stringify(form));

      // Fotos
      photos.forEach((foto) => fd.append("fotos", foto, foto.name));

      const resp = await fetch(`${API_URL}/inspecciones/`, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const err = await resp
          .json()
          .catch(() => ({ detail: resp.statusText }));
        throw new Error(err.detail ?? "Error al guardar la inspección");
      }

      const result: SubmitResult = await resp.json();
      setSubmitResult(result);
      sessionStorage.removeItem("inspeccion_data");
    } catch (err: any) {
      setSubmitError(err.message ?? "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  return (
    <div className="w-[60%] max-w-7xl mx-auto py-6 px-4 pb-12 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
          🔍
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nueva Inspección</h1>
          <p className="text-xs text-muted-foreground capitalize">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Vehículo & Conductor */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                🚌 Vehículo
              </p>
              <Separator />
              <dl className="space-y-1">
                {(
                  [
                    ["Patente", data.vehiculo?.registration],
                    ["Marca", data.vehiculo?.make],
                    ["Modelo", data.vehiculo?.model],
                    ["Color", data.vehiculo?.colour],
                    ["N° Móvil", data.vehiculo?.callsign],
                  ] as [string, string][]
                ).map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <dt className="text-muted-foreground w-14 shrink-0 text-xs">
                      {label}
                    </dt>
                    <dd className="font-mono font-medium text-xs">
                      {val || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                👤 Conductor
              </p>
              <Separator />
              <dl className="space-y-1">
                {(
                  [
                    [
                      "Nombre",
                      `${data.driver?.forename || ""} ${data.driver?.surname || ""}`.trim(),
                    ],
                    ["Email", data.driver?.email],
                    ["CPC", data.driver?.cpcCardNumber],
                  ] as [string, string][]
                ).map(([label, val]) => (
                  <div key={label} className="flex gap-2 flex-wrap">
                    <dt className="text-muted-foreground w-12 shrink-0 text-xs">
                      {label}
                    </dt>
                    <dd className="font-medium text-xs break-all">
                      {val || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Odómetro & Mantención */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            🔧 Odómetro &amp; Mantención
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kilometraje" className="text-xs">
              Kilometraje actual
            </Label>
            <Input
              id="kilometraje"
              type="number"
              placeholder="ej: 125000"
              value={form.kilometraje}
              onChange={(e) => set("kilometraje", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proximaMantencion" className="text-xs">
              Próxima mantención (km)
            </Label>
            <Input
              id="proximaMantencion"
              type="number"
              placeholder="ej: 135000"
              value={form.proximaMantencion}
              onChange={(e) => set("proximaMantencion", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extintorFecha" className="text-xs">
              Extintor válido hasta
            </Label>
            <Input
              id="extintorFecha"
              type="date"
              value={form.extintorFecha}
              onChange={(e) => set("extintorFecha", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              🦺 Seguridad
            </CardTitle>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={toggleAllSeguridad}
            >
              <Checkbox
                id="seguridad-all"
                checked={seguridadAllChecked}
                onCheckedChange={toggleAllSeguridad}
                onClick={(e) => e.stopPropagation()}
                className={
                  seguridadSomeChecked && !seguridadAllChecked
                    ? "opacity-60"
                    : ""
                }
              />
              <Label
                htmlFor="seguridad-all"
                className="text-xs cursor-pointer text-muted-foreground select-none"
              >
                Marcar todos
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <CheckRow
            id="cinturonDelantero"
            label="Cinturón delantero"
            checked={form.cinturonDelantero}
            onChange={(v) => set("cinturonDelantero", v as boolean)}
          />
          <CheckRow
            id="cinturonTrasero"
            label="Cinturón trasero"
            checked={form.cinturonTrasero}
            onChange={(v) => set("cinturonTrasero", v as boolean)}
          />
          <CheckRow
            id="chalecoReflectante"
            label="Chaleco reflectante"
            checked={form.chalecoReflectante}
            onChange={(v) => set("chalecoReflectante", v as boolean)}
          />
          <CheckRow
            id="botiquin"
            label="Botiquín"
            checked={form.botiquin}
            onChange={(v) => set("botiquin", v as boolean)}
          />
          <CheckRow
            id="ruedaRepuesto"
            label="Rueda de repuesto"
            checked={form.ruedaRepuesto}
            onChange={(v) => set("ruedaRepuesto", v as boolean)}
          />
          <CheckRow
            id="triangulosEmergencia"
            label="Triángulos emergencia"
            checked={form.triangulosEmergencia}
            onChange={(v) => set("triangulosEmergencia", v as boolean)}
          />
        </CardContent>
      </Card>

      {/* Neumáticos & Frenos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            ⚙️ Neumáticos &amp; Frenos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProgressSelector
            label="Estado Neumáticos"
            value={form.neumaticos}
            onChange={(v) => set("neumaticos", v)}
          />
          <Separator />
          <ProgressSelector
            label="Estado Frenos"
            value={form.frenos}
            onChange={(v) => set("frenos", v)}
          />
        </CardContent>
      </Card>

      {/* Carrocería */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            🚗 Carrocería
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CarroceriaSelector
            value={form.carroceria}
            onChange={(v) => set("carroceria", v)}
          />
        </CardContent>
      </Card>

      {/* Luces */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              💡 Sistema de Luces
            </CardTitle>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={toggleAllLuces}
            >
              <Checkbox
                id="luces-all"
                checked={lucesAllChecked}
                onCheckedChange={toggleAllLuces}
                onClick={(e) => e.stopPropagation()}
                className={
                  lucesSomeChecked && !lucesAllChecked ? "opacity-60" : ""
                }
              />
              <Label
                htmlFor="luces-all"
                className="text-xs cursor-pointer text-muted-foreground select-none"
              >
                Marcar todos
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {lucesFields.map(({ key, label }) => (
            <CheckRow
              key={key}
              id={key}
              label={label}
              checked={form[key] as boolean}
              onChange={(v) => set(key, v as any)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            📝 Observaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ingresa observaciones adicionales sobre el estado del vehículo..."
            value={form.observaciones}
            onChange={(e) => set("observaciones", e.target.value)}
            rows={4}
            className="resize-y"
          />
        </CardContent>
      </Card>

      {/* Fotografías */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              📸 Fotografías
            </CardTitle>
            {photos.length > 0 && (
              <Badge variant="secondary">
                {photos.length} foto{photos.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PhotoUpload
            photos={photos}
            onAdd={(files) => setPhotos((p) => [...p, ...files])}
            onRemove={(i) => setPhotos((p) => p.filter((_, idx) => idx !== i))}
          />
        </CardContent>
      </Card>

      {/* Resultado */}
      {submitResult && <ResultBanner result={submitResult} />}

      {/* Error */}
      {submitError && (
        <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive font-medium">
            ⚠️ {submitError}
          </p>
        </div>
      )}

      {/* Botón enviar — se oculta tras éxito */}
      {!submitResult && (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="w-full font-mono tracking-wide"
        >
          {submitting ? "Enviando..." : "Enviar Inspección →"}
        </Button>
      )}
    </div>
  );
}
