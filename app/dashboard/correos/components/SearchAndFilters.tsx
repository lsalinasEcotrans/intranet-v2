import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, User } from "lucide-react";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  estadoFilter: EstadoFilter;
  onEstadoFilterChange: (estado: EstadoFilter) => void;
  showOnlyMine: boolean;
  onShowOnlyMineToggle: () => void;
  contadores: {
    todos: number;
    pendientes: number;
    enProceso: number;
    completados: number;
    esperaRespuesta: number;
    respuestaCliente: number;
    mios: number;
  };
}

export type EstadoFilter =
  | "Todos"
  | "Pendiente"
  | "En proceso"
  | "Completado"
  | "Espera de respuesta"
  | "Respuesta de cliente";

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  estadoFilter,
  onEstadoFilterChange,
  showOnlyMine,
  onShowOnlyMineToggle,
  contadores,
}: SearchAndFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por asunto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Badge
          variant={
            estadoFilter === "Todos" && !showOnlyMine ? "default" : "outline"
          }
          className="cursor-pointer"
          onClick={() => onEstadoFilterChange("Todos")}
        >
          Todos ({contadores.todos})
        </Badge>
        <Badge
          variant={estadoFilter === "Pendiente" ? "default" : "outline"}
          className="cursor-pointer border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
          onClick={() => onEstadoFilterChange("Pendiente")}
        >
          Pendientes ({contadores.pendientes})
        </Badge>
        <Badge
          variant={estadoFilter === "En proceso" ? "default" : "outline"}
          className="cursor-pointer border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          onClick={() => onEstadoFilterChange("En proceso")}
        >
          En proceso ({contadores.enProceso})
        </Badge>
        {/* <Badge
          variant={estadoFilter === "Completado" ? "default" : "outline"}
          className="cursor-pointer border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
          onClick={() => onEstadoFilterChange("Completado")}
        >
          Completados ({contadores.completados})
        </Badge> */}
        <Badge
          variant={
            estadoFilter === "Espera de respuesta" ? "default" : "outline"
          }
          className="cursor-pointer border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          onClick={() => onEstadoFilterChange("Espera de respuesta")}
        >
          Espera de respuesta ({contadores.esperaRespuesta})
        </Badge>
        <Badge
          variant={
            estadoFilter === "Respuesta de cliente" ? "default" : "outline"
          }
          className="cursor-pointer border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
          onClick={() => onEstadoFilterChange("Respuesta de cliente")}
        >
          Respuesta de cliente ({contadores.respuestaCliente})
        </Badge>

        <div className="mx-2 h-6 w-px bg-border" />
        <Badge
          variant={showOnlyMine ? "default" : "outline"}
          className="cursor-pointer"
          onClick={onShowOnlyMineToggle}
        >
          <User className="mr-1 h-3 w-3" />
          Mis correos ({contadores.mios})
        </Badge>
      </div>
    </div>
  );
}
