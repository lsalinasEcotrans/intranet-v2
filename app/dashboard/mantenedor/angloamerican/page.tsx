"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();

  return (
    // <div className="p-8">
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-1xl font-bold">
          Selecciona el tipo de turno para continuar
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push(
              "/dashboard/mantenedor/angloamerican/turno?turno=TurnoH",
            )
          }
        >
          Turno H
        </Button>

        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push("/dashboard/mantenedor/angloamerican/turno?turno=4x4")
          }
        >
          4x4
        </Button>

        <Button
          className="h-32 text-xl"
          onClick={() =>
            router.push("/dashboard/mantenedor/angloamerican/turno?turno=7x7")
          }
        >
          7x7
        </Button>
      </div>
    </div>
  );
}
