"use client";

import { useQuery } from "@tanstack/react-query";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface BookingService {
  id: number;
  originalAutoID: number | null;
  pickupDueTime: string;
  customerDisplayName: string;
  driverNote: string;
  pickup: { address: { text: string } };
  destination: { address: { text: string } } | null;
  pricing: {
    cost: number;
    price: number;
    fare: number;
    meterDistance: { asKilometres: number };
    gpsMeterDistance: number;
    waitingTime: number;
  };
  paymentMethod: string;
  paymentType: string;
  archivedBooking: {
    originalAutoID: number;
    reason: string;
    driver: { id: number; callsign: string; fullName: string };
    vehicle: { id: number; callsign: string };
    pickedUpAtTime: string | null;
    completedAtTime: string | null;
    dispatchedAtTime: string | null;
    plateNumber: string;
  } | null;
  activeBooking: unknown | null;
  dispatchedBooking: unknown | null;
}

export interface VehicleWeekData {
  bookings: BookingService[];
  totalServices: number;
  totalCost: number;
  totalDistanceKm: number;
  avgDurationMin: number;
  byDay: Record<string, BookingService[]>;
}

export interface VehiclePeriodData {
  bookings: BookingService[];
  totalServices: number;
  totalCost: number;
  periodFrom: string;
  periodTo: string;
}

// ─────────────────────────────────────────────
// FETCHER — últimos 7 días
// Usa tu route existente: /api/ghost/bookings/search/by-vehicle
// ─────────────────────────────────────────────
async function fetchVehicleWeek(vehicleId: number): Promise<VehicleWeekData> {
  const res = await fetch("/api/ghost/bookings/search/by-vehicle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId }),
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();

  const bookings: BookingService[] = data.bookings ?? [];

  const totalServices   = bookings.length;
  const totalCost       = bookings.reduce((a, b) => a + (b.pricing?.cost ?? 0), 0);
  const totalDistanceKm = bookings.reduce(
    (a, b) => a + (b.pricing?.gpsMeterDistance ?? b.pricing?.meterDistance?.asKilometres ?? 0),
    0
  );

  const durations = bookings
    .map((b) => {
      const s = b.archivedBooking?.pickedUpAtTime;
      const e = b.archivedBooking?.completedAtTime;
      if (!s || !e) return null;
      return (new Date(e).getTime() - new Date(s).getTime()) / 60000;
    })
    .filter((d): d is number => d !== null && d > 0);

  const avgDurationMin =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  // Inicializar los últimos 7 días aunque estén vacíos
  const byDay: Record<string, BookingService[]> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay[d.toISOString().slice(0, 10)] = [];
  }
  bookings.forEach((b) => {
    const day = b.pickupDueTime?.slice(0, 10);
    if (day && day in byDay) byDay[day].push(b);
  });

  return { bookings, totalServices, totalCost, totalDistanceKm, avgDurationMin, byDay };
}

// ─────────────────────────────────────────────
// FETCHER — período de facturación 16→15
// Usa el nuevo route: /api/ghost/bookings/by-vehicle-period
// ─────────────────────────────────────────────
async function fetchVehiclePeriod(vehicleId: number): Promise<VehiclePeriodData> {
  const res = await fetch("/api/ghost/bookings/search/by-period", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId }),
  });

  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();

  const bookings: BookingService[] = data.bookings ?? [];

  return {
    bookings,
    totalServices: bookings.length,
    totalCost:     bookings.reduce((a, b) => a + (b.pricing?.cost ?? 0), 0),
    periodFrom:    data.periodFrom,
    periodTo:      data.periodTo,
  };
}

// ─────────────────────────────────────────────
// HOOKS EXPORTADOS
// ─────────────────────────────────────────────
export function useVehicleWeekReport(vehicleId: number | null) {
  return useQuery({
    queryKey:  ["vehicle-week", vehicleId],
    queryFn:   () => fetchVehicleWeek(vehicleId!),
    enabled:   !!vehicleId,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}

export function useVehiclePeriodReport(vehicleId: number | null) {
  return useQuery({
    queryKey:  ["vehicle-period", vehicleId],
    queryFn:   () => fetchVehiclePeriod(vehicleId!),
    enabled:   !!vehicleId,
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}