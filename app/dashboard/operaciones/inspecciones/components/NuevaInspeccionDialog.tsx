"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { AlertCircle, Plus } from "lucide-react";

export default function NuevaInspeccionDialog() {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const verificar = async () => {
    if (!valor) {
      setError("Debe ingresar una patente");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/ghost/search/inspeccion?registration=${valor}`,
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "No encontrado");

      sessionStorage.setItem("inspeccion_data", JSON.stringify(json));
      setOpen(false);
      router.push("/dashboard/operaciones/inspecciones/new_ins");
    } catch (err: any) {
      setError(err.message || "Vehículo no encontrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nueva revisión
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar vehículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Ej: VX3453"
            value={valor}
            onChange={(e) => setValor(e.target.value.toUpperCase())}
          />

          {/* 🔥 ERROR VISUAL */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={verificar} disabled={loading}>
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
