"use client";
import { PasajerosTable } from "../components/PasajerosTable";

export default function TurnoPage() {
  const data: any[] = []; // aquí debería venir tu fetch real
  return (
    <div className="p-8">
      <PasajerosTable />
    </div>
  );
}
