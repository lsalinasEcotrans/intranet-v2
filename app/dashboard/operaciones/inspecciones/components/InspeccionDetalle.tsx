"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Inspeccion } from "../page";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Extrae la URL de proxy dado un objeto foto o string legado */
function fotoProxyUrl(f: any): string {
  if (!f) return "";
  if (typeof f === "string") return f; // registros legados
  return `/api/inspecciones/foto/${f.item_id}`;
}

function CheckItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={value ? "text-green-500" : "text-destructive"}>
        {value ? "✅" : "❌"}
      </span>
      <span
        className={cn(
          value ? "text-foreground" : "text-muted-foreground line-through",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const bar =
    value <= 25
      ? "bg-destructive"
      : value <= 50
        ? "bg-orange-500"
        : value <= 75
          ? "bg-yellow-500"
          : "bg-green-500";
  const text =
    value <= 25
      ? "text-destructive"
      : value <= 50
        ? "text-orange-500"
        : value <= 75
          ? "text-yellow-500"
          : "text-green-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-mono font-bold", text)}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", bar)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span>{icon}</span>
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  fotos,
  index,
  onClose,
}: {
  fotos: any[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);
  const total = fotos.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
      >
        ✕
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-mono">
        {current + 1} / {total}
      </div>

      {/* Prev */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={fotoProxyUrl(fotos[current])}
        alt={`foto-${current + 1}`}
        className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
        >
          ›
        </button>
      )}

      {/* Thumbnails */}
      {total > 1 && (
        <div className="absolute bottom-4 flex gap-2">
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={cn(
                "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                i === current
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-75",
              )}
            >
              <img
                src={fotoProxyUrl(f)}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InspeccionDetalle({
  inspeccion,
  onClose,
}: {
  inspeccion: Inspeccion;
  onClose: () => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const di = inspeccion.datos_inspeccion ?? {};
  const fotos: any[] = di.fotos ?? [];

  // ── Imprimir PDF ──────────────────────────────────────────────────────────
  const handlePrint = async () => {
    // Convertir fotos a base64 para que aparezcan en la impresión
    const fotosBase64 = await Promise.all(
      fotos.map(async (f) => {
        try {
          const url = fotoProxyUrl(f);
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch {
          return "";
        }
      }),
    );

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inspección #${inspeccion.id} — ${inspeccion.registration}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: white; }
            .wrap { max-width: 800px; margin: 0 auto; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1e3a5f; }
            .logo-box { width: 48px; height: 48px; background: #1e3a5f; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 16px; line-height: 1; text-align: center; padding-top: 14px; }
            .header-left { display: flex; align-items: center; gap: 12px; }
            .company-name { font-size: 18px; font-weight: 800; color: #1e3a5f; }
            .company-sub { font-size: 10px; color: #666; margin-top: 2px; }
            .header-right { text-align: right; }
            .doc-title { font-size: 14px; font-weight: 700; color: #1e3a5f; }
            .doc-id { font-size: 11px; color: #666; margin-top: 2px; }
            .estado-badge { display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
            .aprobado { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .rechazado { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
            .section { margin-bottom: 16px; }
            .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .field { margin-bottom: 6px; }
            .field-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
            .field-value { font-size: 11px; font-weight: 600; color: #111; margin-top: 1px; }
            .checks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
            .check-item { display: flex; align-items: center; gap: 5px; font-size: 10px; padding: 2px 0; }
            .check-ok { color: #166534; }
            .check-fail { color: #991b1b; text-decoration: line-through; opacity: 0.6; }
            .progress-item { margin-bottom: 8px; }
            .progress-header { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
            .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 3px; }
            .fill-red { background: #ef4444; } .fill-orange { background: #f97316; }
            .fill-yellow { background: #eab308; } .fill-green { background: #22c55e; }
            .car-badge { display: inline-block; padding: 3px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .car-bueno { background: #dcfce7; color: #166534; }
            .car-regular { background: #ffedd5; color: #9a3412; }
            .car-malo { background: #fee2e2; color: #991b1b; }
            .obs-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; font-size: 11px; color: #444; line-height: 1.6; }
            .rechazo-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; padding: 10px; font-size: 10px; color: #991b1b; }
            .fotos-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
            .foto-item img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
            .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 1.5cm; } }
          </style>
        </head>
        <body><div class="wrap">
          <div class="header">
            <div class="header-left">
              <div class="logo-box">ET</div>
              <div>
                <div class="company-name">Ecotrans Chile</div>
                <div class="company-sub">Sistema de Inspección Vehicular</div>
              </div>
            </div>
            <div class="header-right">
              <div class="doc-title">Informe de Inspección</div>
              <div class="doc-id">Nº ${inspeccion.id} · ${new Date(inspeccion.fecha_creacion).toLocaleDateString("es-CL")}</div>
              <span class="estado-badge ${inspeccion.estado}">${inspeccion.estado === "aprobado" ? "✓ APROBADO" : "✗ RECHAZADO"}</span>
            </div>
          </div>

          <div class="grid-2 section">
            <div>
              <div class="section-title">🚌 Vehículo</div>
              ${[
                ["Patente", inspeccion.registration],
                ["N° Móvil", inspeccion.callsign],
                [
                  "Marca/Modelo",
                  [inspeccion.make, inspeccion.model].filter(Boolean).join(" "),
                ],
                ["Año", inspeccion.year_manufacture],
              ]
                .map(
                  ([l, v]) =>
                    `<div class="field"><div class="field-label">${l}</div><div class="field-value">${v || "—"}</div></div>`,
                )
                .join("")}
            </div>
            <div>
              <div class="section-title">👤 Conductor</div>
              ${[
                [
                  "Nombre",
                  [inspeccion.forename, inspeccion.surname]
                    .filter(Boolean)
                    .join(" "),
                ],
                ["CPC", inspeccion.cpc_card_number],
              ]
                .map(
                  ([l, v]) =>
                    `<div class="field"><div class="field-label">${l}</div><div class="field-value">${v || "—"}</div></div>`,
                )
                .join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-title">🔧 Odómetro & Mantención</div>
            <div class="grid-3">
              <div class="field"><div class="field-label">Kilometraje</div><div class="field-value">${di.kilometraje ? Number(di.kilometraje).toLocaleString("es-CL") + " km" : "—"}</div></div>
              <div class="field"><div class="field-label">Próxima mantención</div><div class="field-value">${di.proximaMantencion ? Number(di.proximaMantencion).toLocaleString("es-CL") + " km" : "—"}</div></div>
              <div class="field"><div class="field-label">Extintor válido hasta</div><div class="field-value">${di.extintorFecha || "—"}</div></div>
            </div>
          </div>

          <div class="grid-2 section">
            <div>
              <div class="section-title">🦺 Seguridad</div>
              <div class="checks-grid">
                ${[
                  ["cinturonDelantero", "Cinturón delantero"],
                  ["cinturonTrasero", "Cinturón trasero"],
                  ["chalecoReflectante", "Chaleco reflectante"],
                  ["botiquin", "Botiquín"],
                  ["ruedaRepuesto", "Rueda de repuesto"],
                  ["triangulosEmergencia", "Triángulos emergencia"],
                ]
                  .map(
                    ([k, l]) =>
                      `<div class="check-item ${di[k] ? "check-ok" : "check-fail"}">${di[k] ? "✅" : "❌"} ${l}</div>`,
                  )
                  .join("")}
              </div>
            </div>
            <div>
              <div class="section-title">💡 Luces</div>
              <div class="checks-grid">
                ${[
                  ["luzPatenteTransera", "Patente trasera"],
                  ["lucesIntermitentes", "Intermitentes"],
                  ["lucesEstacionamiento", "Estacionamiento"],
                  ["lucesFrenos", "Frenos"],
                  ["lucesMarchaAtras", "Marcha atrás"],
                  ["lucesBajas", "Luces bajas"],
                  ["lucesAltas", "Luces altas"],
                ]
                  .map(
                    ([k, l]) =>
                      `<div class="check-item ${di[k] ? "check-ok" : "check-fail"}">${di[k] ? "✅" : "❌"} ${l}</div>`,
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">⚙️ Neumáticos & Frenos</div>
            ${["neumaticos", "frenos"]
              .map((key) => {
                const v = di[key] ?? 0;
                const fill =
                  v <= 25
                    ? "fill-red"
                    : v <= 50
                      ? "fill-orange"
                      : v <= 75
                        ? "fill-yellow"
                        : "fill-green";
                return `<div class="progress-item"><div class="progress-header"><span>${key === "neumaticos" ? "Neumáticos" : "Frenos"}</span><span><b>${v}%</b></span></div><div class="progress-bar"><div class="progress-fill ${fill}" style="width:${v}%"></div></div></div>`;
              })
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">🚗 Carrocería</div>
            <span class="car-badge car-${(di.carroceria || "").toLowerCase()}">${di.carroceria || "—"}</span>
          </div>

          ${di.observaciones ? `<div class="section"><div class="section-title">📝 Observaciones</div><div class="obs-box">${di.observaciones}</div></div>` : ""}
          ${inspeccion.motivo_rechazo ? `<div class="section"><div class="section-title">⚠️ Motivo de rechazo</div><div class="rechazo-box">${inspeccion.motivo_rechazo}</div></div>` : ""}

          ${
            fotosBase64.filter(Boolean).length > 0
              ? `
            <div class="section">
              <div class="section-title">📸 Fotografías (${fotosBase64.filter(Boolean).length})</div>
              <div class="fotos-grid">
                ${fotosBase64
                  .filter(Boolean)
                  .map(
                    (b64) =>
                      `<div class="foto-item"><img src="${b64}" /></div>`,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <div class="footer">
            <span>Ecotrans Chile · Sistema de Inspección Vehicular</span>
            <span>Generado: ${new Date().toLocaleString("es-CL")} · Próxima: ${new Date(inspeccion.fecha_proxima).toLocaleDateString("es-CL")}</span>
          </div>
        </div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-lg font-bold">
                Inspección #{inspeccion.id} — {inspeccion.registration}
              </DialogTitle>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                🖨️ Imprimir PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Estado */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-sm px-3 py-1",
                  inspeccion.estado === "aprobado"
                    ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {inspeccion.estado === "aprobado"
                  ? "✅ Aprobado"
                  : "❌ Rechazado"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(inspeccion.fecha_creacion)}
              </span>
              <span className="text-xs text-muted-foreground">
                · Próxima:{" "}
                {new Date(inspeccion.fecha_proxima).toLocaleDateString("es-CL")}
              </span>
            </div>

            {inspeccion.motivo_rechazo && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-semibold text-destructive mb-1">
                  Motivo de rechazo
                </p>
                <p className="text-xs text-muted-foreground">
                  {inspeccion.motivo_rechazo}
                </p>
              </div>
            )}

            {/* Vehículo & Conductor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SectionTitle icon="🚌" title="Vehículo" />
                <dl className="space-y-1">
                  {[
                    ["Patente", inspeccion.registration],
                    ["N° Móvil", inspeccion.callsign],
                    ["Marca", inspeccion.make],
                    ["Modelo", inspeccion.model],
                    ["Año", inspeccion.year_manufacture],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="flex gap-2 text-xs">
                      <dt className="text-muted-foreground w-16 shrink-0">
                        {l}
                      </dt>
                      <dd className="font-medium font-mono">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <SectionTitle icon="👤" title="Conductor" />
                <dl className="space-y-1">
                  {[
                    [
                      "Nombre",
                      [inspeccion.forename, inspeccion.surname]
                        .filter(Boolean)
                        .join(" "),
                    ],
                    ["CPC", inspeccion.cpc_card_number],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="flex gap-2 text-xs">
                      <dt className="text-muted-foreground w-16 shrink-0">
                        {l}
                      </dt>
                      <dd className="font-medium">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <Separator />

            {/* Odómetro */}
            <div>
              <SectionTitle icon="🔧" title="Odómetro & Mantención" />
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  [
                    "Kilometraje",
                    di.kilometraje
                      ? `${Number(di.kilometraje).toLocaleString("es-CL")} km`
                      : "—",
                  ],
                  [
                    "Próxima mantención",
                    di.proximaMantencion
                      ? `${Number(di.proximaMantencion).toLocaleString("es-CL")} km`
                      : "—",
                  ],
                  ["Extintor válido hasta", di.extintorFecha || "—"],
                ].map(([l, v]) => (
                  <div key={String(l)}>
                    <p className="text-muted-foreground">{l}</p>
                    <p className="font-mono font-semibold">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Seguridad */}
            <div>
              <SectionTitle icon="🦺" title="Seguridad" />
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ["cinturonDelantero", "Cinturón delantero"],
                  ["cinturonTrasero", "Cinturón trasero"],
                  ["chalecoReflectante", "Chaleco reflectante"],
                  ["botiquin", "Botiquín"],
                  ["ruedaRepuesto", "Rueda de repuesto"],
                  ["triangulosEmergencia", "Triángulos de emergencia"],
                ].map(([k, l]) => (
                  <CheckItem key={k} label={l} value={!!di[k]} />
                ))}
              </div>
            </div>

            <Separator />

            {/* Neumáticos & Frenos */}
            <div>
              <SectionTitle icon="⚙️" title="Neumáticos & Frenos" />
              <div className="space-y-3">
                <ProgressBar label="Neumáticos" value={di.neumaticos ?? 0} />
                <ProgressBar label="Frenos" value={di.frenos ?? 0} />
              </div>
            </div>

            <Separator />

            {/* Carrocería & Luces */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SectionTitle icon="🚗" title="Carrocería" />
                {di.carroceria ? (
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-lg text-sm font-semibold border-2",
                      di.carroceria === "Bueno"
                        ? "border-green-500 text-green-600 bg-green-500/10"
                        : di.carroceria === "Regular"
                          ? "border-orange-500 text-orange-600 bg-orange-500/10"
                          : "border-destructive text-destructive bg-destructive/10",
                    )}
                  >
                    {di.carroceria}
                  </span>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <SectionTitle icon="💡" title="Luces" />
                <div className="space-y-1">
                  {[
                    ["luzPatenteTransera", "Luz patente trasera"],
                    ["lucesIntermitentes", "Luces intermitentes"],
                    ["lucesEstacionamiento", "Luces estacionamiento"],
                    ["lucesFrenos", "Luces de frenos"],
                    ["lucesMarchaAtras", "Luces marcha atrás"],
                    ["lucesBajas", "Luces bajas"],
                    ["lucesAltas", "Luces altas"],
                  ].map(([k, l]) => (
                    <CheckItem key={k} label={l} value={!!di[k]} />
                  ))}
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {di.observaciones && (
              <>
                <Separator />
                <div>
                  <SectionTitle icon="📝" title="Observaciones" />
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
                    {di.observaciones}
                  </p>
                </div>
              </>
            )}

            {/* Fotos */}
            {fotos.length > 0 && (
              <>
                <Separator />
                <div>
                  <SectionTitle
                    icon="📸"
                    title={`Fotografías (${fotos.length})`}
                  />
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(90px, 1fr))",
                    }}
                  >
                    {fotos.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="group relative rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
                      >
                        <img
                          src={fotoProxyUrl(f)}
                          alt={`foto-${i + 1}`}
                          className="w-full aspect-square object-cover group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <span className="text-white text-lg">🔍</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          fotos={fotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
