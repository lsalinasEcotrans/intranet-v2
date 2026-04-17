"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountcode = searchParams.get("accountcode");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <h2 className="text-1xl font-bold">
        Seleccione tipo de proceso para continuar
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push(
              `/dashboard/cargas-masivas/cargaservicios?accountcode=${accountcode}`,
            )
          }
        >
          Cargar Servicios
        </Button>

        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push(
              `/dashboard/cargas-masivas/listapasajeros?accountcode=${accountcode}`,
            )
          }
        >
          Lista Pasajeros
        </Button>
      </div>
    </div>
  );
}
