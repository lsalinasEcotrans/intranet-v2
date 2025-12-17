import { Badge } from "@/components/ui/badge";
import { Loader, ClockFading, CircleCheckBig } from "lucide-react";

interface EstadoBadgeProps {
  estado: string;
}

export default function EstadoBadge({ estado }: EstadoBadgeProps) {
  switch (estado) {
    case "Pendiente":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-orange-300 bg-orange-50 text-orange-700"
        >
          <ClockFading size={14} /> Pendiente
        </Badge>
      );
    case "Completado":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-300 bg-green-50 text-green-700"
        >
          <CircleCheckBig size={14} /> Completado
        </Badge>
      );
    case "En proceso":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-300 bg-yellow-50 text-yellow-700"
        >
          <Loader className="animate-spin" size={14} /> En proceso
        </Badge>
      );
    case "Respuesta de cliente":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-red-300 bg-red-50 text-blue-700"
        >
          <ClockFading size={14} /> Respuesta de cliente
        </Badge>
      );
    case "Espera de respuesta":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-blue-300 bg-blue-50 text-blue-700"
        >
          <ClockFading size={14} /> Espera respuesta
        </Badge>
      );
    default:
      return <Badge variant="secondary">{estado}</Badge>;
  }
}
