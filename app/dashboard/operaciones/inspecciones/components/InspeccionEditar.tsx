"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Inspeccion } from "../page";

type ProgressValue = 0 | 25 | 50 | 75 | 100;
type CarroceriaValue = "Bueno" | "Regular" | "Malo" | "";

const PROGRESS_STEPS: ProgressValue[] = [0, 25, 50, 75, 100];

function progressColor(v: number) {
  if (v <= 25) return "bg-destructive";
  if (v <= 50) return "bg-orange-500";
  if (v <= 75) return "bg-yellow-500";
  return "bg-green-500";
}
function progressTextColor(v: number) {
  if (v <= 25) return "text-destructive";
  if (v <= 50) return "text-orange-500";
  if (v <= 75) return "text-yellow-500";
  return "text-green-500";
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span>{icon}</span>
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CheckRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer",
        checked ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20")}
      onClick={() => onChange(!checked)}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} onClick={(e) => e.stopPropagation()} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal select-none">{label}</Label>
    </div>
  );
}

function ProgressSelector({ label, value, onChange }: { label: string; value: ProgressValue; onChange: (v: ProgressValue) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-sm">{label}</Label>
        <span className={cn("text-xs font-mono font-bold", progressTextColor(value))}>{value}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-secondary">
        <div className={cn("absolute left-0 top-0 h-full rounded-full transition-all", progressColor(value))} style={{ width: `${value}%` }} />
        {PROGRESS_STEPS.map((step) => (
          <button key={step} type="button" onClick={() => onChange(step)}
            className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-pointer z-10 transition-all",
              value >= step ? cn("border-transparent", progressColor(value)) : "border-border bg-background")}
            style={{ left: step === 100 ? "calc(100% - 8px)" : `calc(${step}% - 8px)` }} />
        ))}
      </div>
      <div className="flex justify-between">
        {PROGRESS_STEPS.map((step) => (
          <button key={step} type="button" onClick={() => onChange(step)}
            className={cn("text-[0.65rem] font-mono bg-transparent border-none cursor-pointer p-0",
              value === step ? cn("font-bold", progressTextColor(value)) : "text-muted-foreground")}>
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InspeccionEditar({
  inspeccion,
  onClose,
  onSaved,
}: {
  inspeccion: Inspeccion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const di = inspeccion.datos_inspeccion ?? {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    kilometraje:          String(di.kilometraje ?? ""),
    proximaMantencion:    String(di.proximaMantencion ?? ""),
    extintorFecha:        di.extintorFecha ?? "",
    cinturonDelantero:    !!di.cinturonDelantero,
    cinturonTrasero:      !!di.cinturonTrasero,
    chalecoReflectante:   !!di.chalecoReflectante,
    botiquin:             !!di.botiquin,
    ruedaRepuesto:        !!di.ruedaRepuesto,
    triangulosEmergencia: !!di.triangulosEmergencia,
    neumaticos:           (di.neumaticos ?? 100) as ProgressValue,
    frenos:               (di.frenos ?? 100) as ProgressValue,
    carroceria:           (di.carroceria ?? "") as CarroceriaValue,
    luzPatenteTransera:   !!di.luzPatenteTransera,
    lucesIntermitentes:   !!di.lucesIntermitentes,
    lucesEstacionamiento: !!di.lucesEstacionamiento,
    lucesFrenos:          !!di.lucesFrenos,
    lucesMarchaAtras:     !!di.lucesMarchaAtras,
    lucesBajas:           !!di.lucesBajas,
    lucesAltas:           !!di.lucesAltas,
    observaciones:        di.observaciones ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Seguridad toggle
  const segFields = ["cinturonDelantero","cinturonTrasero","chalecoReflectante","botiquin","ruedaRepuesto","triangulosEmergencia"] as const;
  const segAll = segFields.every((f) => form[f]);
  const segSome = segFields.some((f) => form[f]);
  const toggleSeg = () => { const v = !segAll; segFields.forEach((f) => set(f, v)); };

  // Luces toggle
  const lucesFields = ["luzPatenteTransera","lucesIntermitentes","lucesEstacionamiento","lucesFrenos","lucesMarchaAtras","lucesBajas","lucesAltas"] as const;
  const lucesAll = lucesFields.every((f) => form[f]);
  const lucesSome = lucesFields.some((f) => form[f]);
  const toggleLuces = () => { const v = !lucesAll; lucesFields.forEach((f) => set(f, v)); };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch(`/api/inspecciones/${inspeccion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datos_inspeccion: { ...di, ...form, fotos: di.fotos ?? [] },
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw new Error(e.detail ?? "Error al guardar");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Inspección #{inspeccion.id} — {inspeccion.registration}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Odómetro */}
          <div>
            <SectionTitle icon="🔧" title="Odómetro & Mantención" />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kilometraje actual</Label>
                <Input type="number" value={form.kilometraje} onChange={(e) => set("kilometraje", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Próxima mantención (km)</Label>
                <Input type="number" value={form.proximaMantencion} onChange={(e) => set("proximaMantencion", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Extintor válido hasta</Label>
                <Input type="date" value={form.extintorFecha} onChange={(e) => set("extintorFecha", e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Seguridad */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>🦺</span>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Seguridad</p>
                <div className="w-24 h-px bg-border" />
              </div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleSeg}>
                <Checkbox checked={segAll} onCheckedChange={toggleSeg} onClick={(e) => e.stopPropagation()}
                  className={segSome && !segAll ? "opacity-60" : ""} />
                <Label className="text-xs cursor-pointer text-muted-foreground select-none">Marcar todos</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CheckRow id="e-cinturonDelantero"    label="Cinturón delantero"    checked={form.cinturonDelantero}    onChange={(v) => set("cinturonDelantero", v as boolean)} />
              <CheckRow id="e-cinturonTrasero"      label="Cinturón trasero"      checked={form.cinturonTrasero}      onChange={(v) => set("cinturonTrasero", v as boolean)} />
              <CheckRow id="e-chalecoReflectante"   label="Chaleco reflectante"   checked={form.chalecoReflectante}   onChange={(v) => set("chalecoReflectante", v as boolean)} />
              <CheckRow id="e-botiquin"             label="Botiquín"              checked={form.botiquin}             onChange={(v) => set("botiquin", v as boolean)} />
              <CheckRow id="e-ruedaRepuesto"        label="Rueda de repuesto"     checked={form.ruedaRepuesto}        onChange={(v) => set("ruedaRepuesto", v as boolean)} />
              <CheckRow id="e-triangulosEmergencia" label="Triángulos emergencia" checked={form.triangulosEmergencia} onChange={(v) => set("triangulosEmergencia", v as boolean)} />
            </div>
          </div>

          <Separator />

          {/* Neumáticos & Frenos */}
          <div>
            <SectionTitle icon="⚙️" title="Neumáticos & Frenos" />
            <div className="space-y-4">
              <ProgressSelector label="Neumáticos" value={form.neumaticos} onChange={(v) => set("neumaticos", v)} />
              <ProgressSelector label="Frenos" value={form.frenos} onChange={(v) => set("frenos", v)} />
            </div>
          </div>

          <Separator />

          {/* Carrocería */}
          <div>
            <SectionTitle icon="🚗" title="Carrocería" />
            <div className="grid grid-cols-3 gap-2">
              {(["Bueno", "Regular", "Malo"] as CarroceriaValue[]).map((opt) => (
                <button key={opt} type="button" onClick={() => set("carroceria", opt)}
                  className={cn("py-2.5 rounded-lg border-2 font-semibold text-sm cursor-pointer bg-transparent transition-all",
                    form.carroceria === opt
                      ? opt === "Bueno" ? "border-green-500 bg-green-500/10 text-green-600"
                        : opt === "Regular" ? "border-orange-500 bg-orange-500/10 text-orange-600"
                        : "border-destructive bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground")}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Luces */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Sistema de Luces</p>
                <div className="w-16 h-px bg-border" />
              </div>
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleLuces}>
                <Checkbox checked={lucesAll} onCheckedChange={toggleLuces} onClick={(e) => e.stopPropagation()}
                  className={lucesSome && !lucesAll ? "opacity-60" : ""} />
                <Label className="text-xs cursor-pointer text-muted-foreground select-none">Marcar todos</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CheckRow id="e-luzPatente"        label="Luz patente trasera"    checked={form.luzPatenteTransera}   onChange={(v) => set("luzPatenteTransera", v as boolean)} />
              <CheckRow id="e-intermitentes"     label="Luces intermitentes"    checked={form.lucesIntermitentes}   onChange={(v) => set("lucesIntermitentes", v as boolean)} />
              <CheckRow id="e-estacionamiento"   label="Luces estacionamiento"  checked={form.lucesEstacionamiento} onChange={(v) => set("lucesEstacionamiento", v as boolean)} />
              <CheckRow id="e-lucesFrenos"       label="Luces de frenos"        checked={form.lucesFrenos}          onChange={(v) => set("lucesFrenos", v as boolean)} />
              <CheckRow id="e-marchaAtras"       label="Luces marcha atrás"     checked={form.lucesMarchaAtras}     onChange={(v) => set("lucesMarchaAtras", v as boolean)} />
              <CheckRow id="e-lucesBajas"        label="Luces bajas"            checked={form.lucesBajas}           onChange={(v) => set("lucesBajas", v as boolean)} />
              <CheckRow id="e-lucesAltas"        label="Luces altas"            checked={form.lucesAltas}           onChange={(v) => set("lucesAltas", v as boolean)} />
            </div>
          </div>

          <Separator />

          {/* Observaciones */}
          <div>
            <SectionTitle icon="📝" title="Observaciones" />
            <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={3} className="resize-y" />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">⚠️ {error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar y recalcular estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
