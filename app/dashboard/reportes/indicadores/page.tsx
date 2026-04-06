"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip as RechartsTooltip, // <--- Cámbialo aquí
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Car,
  Route,
  Clock,
  Wallet,
  Users,
  MapPin,
  CreditCard,
  CheckCircle2,
  Download,
  ChevronDown,
  Calendar,
  Zap,
  Target,
  Info,
  ShieldCheck,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface VehicleStats {
  vehicleId: number;
  callsign: string;
  totalServices: number;
  totalProduction: number;
  totalDistanceKm: number;
  avgTicket: number;
  avgDurationMin: number;
  efficiency: number;
  utilization: number;
}

interface ReportMetrics {
  totalProduction: number;
  totalServices: number;
  totalDistanceKm: number;
  avgTicket: number;
  avgDistanceKm: number;
  totalExtraCost: number;
  totalWaitingMin: number;
  totalWaitingHours: number;
  completionRate: number;
  avgDispatchTimeMin: number;
  avgOnTimeRate: number;
  totalVehicles: number;
  avgUtilization: number;
  top3Services: VehicleStats[];
  top3Production: VehicleStats[];
  top3Efficiency: VehicleStats[];
  top3Distance: VehicleStats[];
  topZoneProduction: { name: string; production: number }[];
  daily: {
    date: string;
    services: number;
    production: number;
    distanceKm: number;
  }[];
  hourly: { hour: number; count: number }[];
  topClients: { name: string; services: number; production: number }[];
  topZones: {
    name: string;
    pickups: number;
    dropoffs: number;
    production: number;
  }[];
  serviciosFlota: number;
  montoFlota: number;
  porcentajeFlota: number;
  apoyoCount: number;
  apoyoPct: number;
  paymentMix: {
    method: string;
    count: number;
    pct: number;
  }[];
  montoApoyo: number;
}

interface ReportData {
  period: { from: string; to: string };
  prevPeriod: { from: string; to: string };
  current: ReportMetrics;
  previous: {
    totalProduction: number;
    totalServices: number;
    avgTicket: number;
    totalDistanceKm: number;
    avgUtilization: number;
  };
  delta: {
    production: number;
    services: number;
    avgTicket: number;
    distanceKm: number;
    utilization: number;
  };
  summary: {
    bookingsProcessed: number;
    prevBookingsProcessed: number;
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("es-CL", { maximumFractionDigits: decimals });
}

function formatDuration(min: number) {
  const hours = Math.floor(min / 60);
  const mins = Math.round(min % 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function getRangePreset(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// ─────────────────────────────────────────────
// KPI CARD CORREGIDO
// ─────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  value: string;
  sub?: string;
  delta?: number;
  trend?: "up" | "down" | "flat";
}

function KpiCard({ icon, title, value, sub, delta }: KpiCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const isPositive = delta && delta > 0;
  const isFlat = delta === 0;

  return (
    <Card className="p-4 flex flex-col gap-2 h-[90px] hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{title}</span>
        </div>
        {hasDelta && (
          <Badge
            variant={isFlat ? "secondary" : "outline"} // Usamos outline para que no interfieran los colores base
            className={`text-xs px-2 py-0.5 gap-1 border-none ${
              isFlat
                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" // Estilo para neutro
                : isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            }`}
          >
            {isFlat ? (
              <Minus className="h-3 w-3" />
            ) : isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
      {sub && (
        <p className="text-xs text-muted-foreground line-clamp-2">{sub}</p>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────
// PODIO TOP 3
// ─────────────────────────────────────────────
const MEDALS = ["🥇", "🥈", "🥉"];

function PodioCard({
  title,
  data,
  valueKey,
  format,
}: {
  title: string;
  data: VehicleStats[];
  valueKey: keyof VehicleStats;
  format: (n: number) => string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="space-y-2.5">
        {data.map((v, i) => (
          <div
            key={v.vehicleId}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{MEDALS[i]}</span>
              <span className="font-semibold text-sm">{v.callsign}</span>
            </div>
            <span className="text-sm font-medium tabular-nums">
              {format(v[valueKey] as number)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// HEATMAP DE HORAS
// ─────────────────────────────────────────────
function HeatmapHoras({
  hourly,
}: {
  hourly: { hour: number; count: number }[];
}) {
  const max = Math.max(...hourly.map((h) => h.count), 1);
  const blocks = Array.from({ length: 24 }, (_, i) => {
    const h = hourly.find((x) => x.hour === i) ?? { hour: i, count: 0 };
    return { ...h, pct: h.count / max };
  });

  const getColor = (pct: number) => {
    if (pct === 0) return "bg-muted";
    if (pct < 0.25) return "bg-blue-100 dark:bg-blue-900/30";
    if (pct < 0.5) return "bg-blue-300 dark:bg-blue-700/50";
    if (pct < 0.75) return "bg-blue-500 dark:bg-blue-500";
    return "bg-blue-700 dark:bg-blue-300";
  };

  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Distribución horaria
      </p>
      <div className="grid grid-cols-12 gap-1.5 mb-4">
        {blocks.map((b) => (
          <div key={b.hour} className="flex flex-col items-center gap-1">
            <div
              className={`w-10 h-10 rounded-lg shadow-sm border transition-all ${getColor(b.pct)} hover:scale-110`}
              title={`${b.hour}:00 - ${b.count} servicios (${Math.round(b.pct * 100)}%)`}
            />
            <span className="text-[10px] font-mono tabular-nums">
              {String(b.hour).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// MIX DE PAGOS
// ─────────────────────────────────────────────
const PAYMENT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

function PaymentMixCard({
  data,
}: {
  data: { method: string; count: number; pct: number }[];
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Mix de métodos de pago
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="method"
            tick={{ fontSize: 11 }}
            width={90}
          />
          <RechartsTooltip
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const value = payload[0].value;
                if (value == null) return <div style={{ fontSize: 12 }}>—</div>;
                const num = Number(value);
                if (isNaN(num))
                  return <div style={{ fontSize: 12 }}>{String(value)}</div>;
                return <div style={{ fontSize: 12 }}>{num.toFixed(1)}%</div>;
              }
              return null;
            }}
          />
          <Bar dataKey="pct" maxBarSize={20} radius={[4, 0, 0, 4]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─────────────────────────────────────────────
// TOP CLIENTES
// ─────────────────────────────────────────────
function TopClientesCard({
  data,
}: {
  data: { name: string; services: number; production: number }[];
}) {
  const maxProd = Math.max(...data.map((c) => c.production), 1);
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Top 10 clientes
      </p>
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {data.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[140px] font-medium">
                  {c.name}
                </span>
                <div className="text-right ml-2 shrink-0">
                  <div>{fmt(c.services)} srv</div>
                  <div className="font-mono">{formatCLP(c.production)}</div>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/60 rounded-full transition-all"
                  style={{
                    width: `${Math.min((c.production / maxProd) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

// ─────────────────────────────────────────────
// TOP ZONAS TABLA
// ─────────────────────────────────────────────
function TopZonasCard({
  data,
}: {
  data: {
    name: string;
    pickups: number;
    dropoffs: number;
    production: number;
  }[];
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Zonas más activas
      </p>
      <ScrollArea className="h-full">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-muted/50">
              <th className="text-left pb-2 font-medium w-8/12">Zona</th>
              <th className="text-right pb-2 font-medium w-1/12">Total</th>
              <th className="text-right pb-2 font-medium w-1/12">Prod.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/30">
            {data.map((z, i) => (
              <tr key={z.name} className="hover:bg-muted/50 transition-colors">
                <td className="py-2 font-medium max-w-0 truncate">{z.name}</td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {z.pickups + z.dropoffs}
                </td>
                <td className="py-2 text-right font-mono tabular-nums">
                  {formatCLP(z.production)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </Card>
  );
}

// ─────────────────────────────────────────────
// TOP ZONAS PRODUCCIÓN
// ─────────────────────────────────────────────
function TopZoneProductionCard({
  data,
}: {
  data: { name: string; production: number }[];
}) {
  const maxProd = Math.max(...data.map((z) => z.production), 1);
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Zonas más productivas
      </p>
      <div className="space-y-2">
        {data.map((z) => (
          <div key={z.name} className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium truncate max-w-[120px]">
              {z.name}
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full mx-2">
              <div
                className="h-full bg-linear-to-r from-orange-400 to-orange-600 rounded-full"
                style={{ width: `${(z.production / maxProd) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums">
              {formatCLP(z.production)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SECCIÓN COLAPSABLE
// ─────────────────────────────────────────────
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between w-full p-4 -m-4 rounded-xl hover:bg-muted transition-colors cursor-pointer mb-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className={`space-y-4 ${className}`}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────
// CONTENIDO DE TABS
// ─────────────────────────────────────────────
function KPIsContent({
  c,
  d,
  p,
}: {
  c: ReportMetrics;
  d: NonNullable<ReportData["delta"]>;
  p: NonNullable<ReportData["previous"]>;
}) {
  return (
    <div className="space-y-8">
      <CollapsibleSection title="📊 KPIs Clave" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Wallet className="h-4 w-4" />}
            title="Venta Total"
            value={formatCLP(c.totalProduction)}
            sub={`Anterior: ${formatCLP(p.totalProduction)}`}
            delta={d.production}
          />
          <KpiCard
            icon={<Users className="h-4 w-4" />}
            title="Servicios Realizados"
            value={`${fmt(c.totalServices)} serv.`}
            sub={`Meta ant: ${fmt(p.totalServices)}`}
            delta={d.services}
          />
          {/* NUEVA: AUTONOMÍA DE FLOTA (Usando 'c') */}
          <KpiCard
            title="Autonomía de Flota"
            value={`${c.porcentajeFlota.toFixed(1)}%`}
            icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
            sub={`${c.serviciosFlota} viajes de la casa`}
          />
          {/* NUEVA: PRODUCCIÓN INTERNA (Usando 'c') */}
          <KpiCard
            title="Producción Interna"
            value={formatCLP(c.montoFlota)}
            icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            sub={`Apoyo: ${formatCLP(c.apoyoCount * c.avgTicket)}`} // Estimación de fuga
          />
          <KpiCard
            icon={<Route className="h-4 w-4" />}
            title="Kilometraje"
            value={fmt(c.totalDistanceKm, 0) + " km"}
            sub={`Promedio: ${fmt(c.avgDistanceKm, 1)} km por viaje`}
            delta={d.distanceKm}
          />
          <KpiCard
            icon={<Clock className="h-4 w-4" />}
            title={
              <div className="flex items-center gap-1">
                <span>Tiempo de Espera</span>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="cursor-help outline-none inline-flex">
                        <Info className="h-3 w-3 text-muted-foreground/50 hover:text-primary transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[220px] text-xs leading-relaxed font-normal"
                    >
                      <p>Tiempo acumulado esperando al pasajero.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            value={`${c.totalWaitingHours}h totales`}
            sub={formatDuration(c.totalWaitingMin)}
          />
          <KpiCard
            icon={<Zap className="h-4 w-4" />}
            title="Eficiencia de Flota"
            value={`${c.avgUtilization.toFixed(0)}%`}
            sub={`${c.totalVehicles} móviles activos`}
            delta={d.utilization}
          />
          <KpiCard
            icon={<Target className="h-4 w-4" />}
            title="Rapidez de Despacho"
            value={formatDuration(c.avgDispatchTimeMin)}
            sub={
              c.avgOnTimeRate > 0
                ? `Atraso: ${formatDuration(c.avgOnTimeRate)}`
                : "Sin retrasos"
            }
          />
          {/* 1. LA TORTA COMPLETA */}
          <KpiCard
            icon={<Wallet className="h-4 w-4 text-slate-900" />}
            title="Venta Total (Bruta)"
            value={formatCLP(c.totalProduction)}
            sub="Ingreso total capturado por la agencia"
          />

          {/* 2. LO QUE SE QUEDÓ EN CASA */}
          <KpiCard
            icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
            title="Producción Interna"
            value={formatCLP(c.montoFlota)}
            sub={`${c.porcentajeFlota.toFixed(1)}% de la operación`}
          />

          {/* 3. LO QUE SE FUE A TERCEROS (LA RESTA) */}
          <KpiCard
            icon={<ExternalLink className="h-4 w-4 text-orange-600" />}
            title="Costo de Apoyo (Fuga)"
            value={formatCLP(c.montoApoyo)} // Esta es la resta que querías
            sub={`${c.apoyoPct} servicios derivados a externos`}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="🗺️ Zonas más productivas">
        <TopZoneProductionCard data={c.topZoneProduction} />
      </CollapsibleSection>
    </div>
  );
}

function VehiclesContent({ c }: { c: ReportMetrics }) {
  return (
    <div className="space-y-8">
      <CollapsibleSection title="🏆 Top 3 Móviles" defaultOpen={true}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PodioCard
            title="Servicios"
            data={c.top3Services}
            valueKey="totalServices"
            format={(n) => `${fmt(n)} srv`}
          />
          <PodioCard
            title="Producción"
            data={c.top3Production}
            valueKey="totalProduction"
            format={formatCLP}
          />
          <PodioCard
            title="Eficiencia"
            data={c.top3Efficiency}
            valueKey="efficiency"
            format={formatCLP}
          />
          <PodioCard
            title="Distancia"
            data={c.top3Distance}
            valueKey="totalDistanceKm"
            format={(n) => `${fmt(n, 0)} km`}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="🕒 Distribución horaria">
        <HeatmapHoras hourly={c.hourly} />
      </CollapsibleSection>
    </div>
  );
}

function ZonesContent({ c }: { c: ReportMetrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <TopZoneProductionCard data={c.topZoneProduction} />
        <TopClientesCard data={c.topClients} />
      </div>
      <div className="space-y-6">
        <TopZonasCard data={c.topZones} />
        <PaymentMixCard data={c.paymentMix} />
      </div>
    </div>
  );
}

function TrendsContent({ c }: { c: ReportMetrics }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold">📈 Evolución diaria</h3>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="gap-1 bg-primary/5 border-primary/20"
          >
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs">Producción</span>
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 bg-blue-500/5 border-blue-500/20"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs">Servicios</span>
          </Badge>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={c.daily}
            margin={{ left: 0, right: 20, top: 10, bottom: 20 }}
          >
            <CartesianGrid
              vertical={false} // Limpiamos el ruido visual vertical
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              opacity={0.5}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              // minTickGap es la clave: asegura que las fechas no se choquen
              // aunque haya 30 o 60 días en el arreglo.
              minTickGap={15}
              tickFormatter={(v) => {
                const parts = v.split("-");
                return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : v;
              }}
              dy={10} // Espaciado vertical para que no pegue al eje
            />

            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              width={45}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />

            <RechartsTooltip
              contentStyle={
                {
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                } as React.CSSProperties
              }
              formatter={(value: any, name: string | number | undefined) => {
                if (value == null) return ["—", name];
                const label =
                  name === "production" ? "Producción" : "Servicios";
                const formattedValue =
                  name === "production" ? formatCLP(Number(value)) : value;
                return [formattedValue, label];
              }}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="production"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={
                c.daily.length < 15 ? { r: 4, fill: "var(--primary)" } : false
              }
              activeDot={{ r: 6, strokeWidth: 0 }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="services"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5" // Diferenciamos servicios con línea discontinua
              dot={c.daily.length < 15 ? { r: 3, fill: "#3B82F6" } : false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-32 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────
export default function DashboardPro() {
  const [from, setFrom] = useState(getRangePreset(7).from);
  const [to, setTo] = useState(getRangePreset(7).to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "kpis" | "vehicles" | "zones" | "trends"
  >("kpis");

  const fetchData = useCallback(async () => {
    if (!from || !to || from > to) {
      setError("Selecciona un rango de fechas válido");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/reports",
        { from, to },
        {
          timeout: 600000,
        },
      );
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Error al cargar datos");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const c = data?.current;
  const d = data?.delta;
  const p = data?.previous;

  const hoy = new Date();

  const presets = [
    { label: "Hoy", value: getRangePreset(0) },
    { label: "7 días", value: getRangePreset(7) },
    { label: "30 días", value: getRangePreset(30) }, // getRangePreset usualmente ya resta días
    {
      label: "Periodo Facturación",
      value: (() => {
        const fechaActual = new Date();
        const diaActual = fechaActual.getDate();

        let mesInicio, anioInicio, mesFin, anioFin;

        // Si hoy es 16 o más, el periodo es del 16 del mes pasado al 15 de este mes
        // Si hoy es 15 o menos, el periodo es del 16 de hace dos meses al 15 del mes pasado
        if (diaActual >= 16) {
          mesInicio = fechaActual.getMonth() - 1;
          anioInicio = fechaActual.getFullYear();
          mesFin = fechaActual.getMonth();
          anioFin = fechaActual.getFullYear();
        } else {
          mesInicio = fechaActual.getMonth() - 2;
          anioInicio = fechaActual.getFullYear();
          mesFin = fechaActual.getMonth() - 1;
          anioFin = fechaActual.getFullYear();
        }

        const desde = new Date(anioInicio, mesInicio, 16);
        const hasta = new Date(anioFin, mesFin, 15);

        return {
          from: desde.toISOString().slice(0, 10),
          to: hasta.toISOString().slice(0, 10),
        };
      })(),
    },
  ];

  const setPreset = (preset: { from: string; to: string }) => {
    setFrom(preset.from);
    setTo(preset.to);
  };

  const exportData = () => {
    if (!data) return;
    const exportData = {
      period: data.period,
      kpis: {
        production: c?.totalProduction,
        services: c?.totalServices,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${data.period.from}_to_${data.period.to}.json`;
    a.click();
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
              Dashboard Operativo
            </h1>
            {data && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>
                  {data.period.from} → {data.period.to}
                </span>
                <span className="w-px h-4 bg-muted mx-2" />
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {data.summary.bookingsProcessed.toLocaleString()} servicios
                </Badge>
                {data.prevPeriod && (
                  <>
                    <span>vs</span>
                    <Badge variant="secondary">
                      {data.summary.prevBookingsProcessed.toLocaleString()} ant.
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CONTROLES */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={
                    from === preset.value.from && to === preset.value.to
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  className="h-9 px-3 text-xs capitalize"
                  onClick={() => setPreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-32 h-10"
              max={to}
            />
            <span className="text-muted-foreground font-mono text-sm">→</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-32 h-10"
              min={from}
            />
            <Button
              onClick={fetchData}
              disabled={loading}
              className="h-10 gap-2"
            >
              <Calendar className="h-4 w-4" />
              Generar
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {error}
          </p>
        </Card>
      )}

      {/* ✅ TABS Y CONTENIDO PRINCIPAL */}
      {data && c && d && p && (
        <div className="space-y-6">
          <div className="flex bg-muted/80 backdrop-blur-md rounded-xl p-1.5 sticky top-4 z-50 shadow-sm border">
            <Button
              variant={activeTab === "kpis" ? "default" : "ghost"}
              className="flex-1 gap-2 text-xs md:text-sm h-10"
              onClick={() => setActiveTab("kpis")}
            >
              <Target className="h-4 w-4" />
              General
            </Button>
            <Button
              variant={activeTab === "vehicles" ? "default" : "ghost"}
              className="flex-1 gap-2 text-xs md:text-sm h-10"
              onClick={() => setActiveTab("vehicles")}
            >
              <Car className="h-4 w-4" />
              Móviles
            </Button>
            <Button
              variant={activeTab === "zones" ? "default" : "ghost"}
              className="flex-1 gap-2 text-xs md:text-sm h-10"
              onClick={() => setActiveTab("zones")}
            >
              <MapPin className="h-4 w-4" />
              Zonas
            </Button>
            <Button
              variant={activeTab === "trends" ? "default" : "ghost"}
              className="flex-1 gap-2 text-xs md:text-sm h-10"
              onClick={() => setActiveTab("trends")}
            >
              <TrendingUp className="h-4 w-4" />
              Tendencias
            </Button>
          </div>

          <div className="mt-8 transition-all duration-300">
            {activeTab === "kpis" && <KPIsContent c={c} d={d} p={p} />}
            {activeTab === "vehicles" && <VehiclesContent c={c} />}
            {activeTab === "zones" && <ZonesContent c={c} />}
            {activeTab === "trends" && <TrendsContent c={c} />}
          </div>

          <div className="flex justify-end pt-8">
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Reporte
            </Button>
          </div>
        </div>
      )}

      {!data && !loading && (
        <Card className="p-20 border-dashed flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-primary/5 rounded-full">
            <Calendar className="h-10 w-10 text-primary/40" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Sin datos seleccionados</h3>
            <p className="text-muted-foreground max-w-xs">
              Selecciona un rango de fechas y presiona <b>Generar</b> para ver
              las métricas de tu flota.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
