"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-1xl font-bold">
          Seleccione tipo de proceso para continuar
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Button
          className="h-32 text-xl"
          onClick={() =>
             router.push("/dashboard/cargas-masivas/hualpen/cargaservicios")
          }
        >
          Cargar Servicios
        </Button>

        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push("/dashboard/cargas-masivas/hualpen/listapasajeros")
          }
        >
          Lista Pasajeros
        </Button>

      </div>
    </div>
  );
}
