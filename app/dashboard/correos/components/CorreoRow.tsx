import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BadgeCheckIcon, User, EllipsisVertical } from "lucide-react";
import EstadoBadge from "./filtros/EstadoBadge";

function getIntencionBadge(intencion: string) {
  const intencionLower = intencion.toLowerCase();

  if (intencionLower.includes("reserva")) {
    return (
      <Badge
        variant="outline"
        className="border-green-300 bg-green-50 text-green-700 font-normal"
      >
        {intencion}
      </Badge>
    );
  }

  if (
    intencionLower.includes("cotizacion") ||
    intencionLower.includes("cotización")
  ) {
    return (
      <Badge
        variant="outline"
        className="border-yellow-300 bg-yellow-50 text-yellow-700 font-normal"
      >
        {intencion}
      </Badge>
    );
  }

  if (intencionLower.includes("otro")) {
    return (
      <Badge
        variant="outline"
        className="border-purple-300 bg-purple-50 text-purple-700 font-normal"
      >
        {intencion}
      </Badge>
    );
  }

  // Por defecto: gris
  return (
    <Badge
      variant="outline"
      className="border-gray-300 bg-gray-50 text-gray-700 font-normal"
    >
      {intencion}
    </Badge>
  );
}

interface CorreoNormalizado {
  id: number;
  fecha: string;
  asunto: string;
  estado: string;
  asignado: string | null;
  idCorreo: number;
  intencion: string;
  estadoNormalizado: string;
  fechaTimestamp: number;
  esMio: boolean;
}

interface CorreoRowProps {
  correo: CorreoNormalizado;
  onClick: (correo: CorreoNormalizado) => void;
}

export default function CorreoRow({ correo, onClick }: CorreoRowProps) {
  const esClickeable =
    (correo.estadoNormalizado === "Pendiente" || correo.esMio) &&
    correo.estadoNormalizado !== "Completado";

  return (
    <TableRow
      onClick={() => esClickeable && onClick(correo)}
      className={`transition ${
        esClickeable ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed"
      } ${correo.esMio ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}
    >
      <TableCell className="font-medium">
        {new Date(correo.fecha).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className="max-w-[400px] truncate">
        <div className="flex items-center gap-2">
          {correo.esMio && <User className="h-4 w-4 text-blue-600" />}
          <span className={correo.esMio ? "font-medium" : ""}>
            {correo.asunto}
          </span>
        </div>
      </TableCell>

      <TableCell>{getIntencionBadge(correo.intencion)}</TableCell>
      <TableCell>
        <EstadoBadge estado={correo.estadoNormalizado} />
      </TableCell>
      <TableCell>
        {correo.asignado ? (
          <Badge
            variant="outline"
            className={
              correo.esMio
                ? "border-blue-300 bg-blue-100 text-blue-700"
                : "border-gray-300 bg-gray-100 text-gray-700"
            }
          >
            <BadgeCheckIcon className="mr-1" size={14} />
            {correo.asignado}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Sin asignar
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
            <DropdownMenuItem>Liberar</DropdownMenuItem>
            <DropdownMenuItem>Reasignar</DropdownMenuItem>
            <DropdownMenuItem>Ver correo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Papelera</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
