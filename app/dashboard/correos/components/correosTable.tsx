"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader,
  ClockFading,
  BadgeCheckIcon,
  CircleCheckBig,
  Search,
  Filter,
  User,
  EllipsisVertical,
} from "lucide-react";

interface UserData {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface Correo {
  id: number;
  fecha: string;
  asunto: string;
  estado: string;
  asignado: string | null;
  idCorreo: number;
  intencion: string;
}

type EstadoFilter = "Todos" | "Pendiente" | "En proceso" | "Completado";

export default function CorreosTable() {
  const [user, setUser] = useState<UserData | null>(null);
  const [correos, setCorreos] = useState<Correo[]>([]);
  const [selectedCorreo, setSelectedCorreo] = useState<Correo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("Todos");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const router = useRouter();

  // Leer usuario de cookie
  useEffect(() => {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.user_data) {
      try {
        const data = JSON.parse(decodeURIComponent(cookies.user_data));
        setUser(data);
      } catch (e) {
        console.error("Error al leer cookie de usuario:", e);
      }
    }
  }, []);

  // Cargar correos
  useEffect(() => {
    axios
      .get(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/headers"
      )
      .then((res) => setCorreos(res.data))
      .catch((err) => console.error("Error cargando correos:", err));
  }, []);

  // Normalizar estado
  const normalizeEstado = (estado: string): string => {
    if (estado === "1" || estado === "Pendiente") return "Pendiente";
    if (estado === "3" || estado === "En proceso") return "En proceso";
    if (estado === "4" || estado === "Completado") return "Completado";
    return estado;
  };

  // Filtrar y ordenar correos
  const correosFiltrados = useMemo(() => {
    let filtered = correos.filter(() => true); // Crear nueva referencia

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((c) =>
        c.asunto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado (solo si NO es "Todos")
    if (estadoFilter && estadoFilter !== "Todos") {
      filtered = filtered.filter((c) => {
        const estadoNorm = normalizeEstado(c.estado);
        return estadoNorm === estadoFilter;
      });
    }

    // Filtro "solo míos"
    if (showOnlyMine && user) {
      filtered = filtered.filter((c) => c.asignado === user.fullName);
    }

    // Ordenar: primero los del usuario, luego por fecha
    return filtered.sort((a, b) => {
      if (user) {
        const aEsMio = a.asignado === user.fullName;
        const bEsMio = b.asignado === user.fullName;
        if (aEsMio && !bEsMio) return -1;
        if (!aEsMio && bEsMio) return 1;
      }
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  }, [correos, searchTerm, estadoFilter, showOnlyMine, user]);

  // Contar correos por estado
  const contadores = useMemo(() => {
    return {
      todos: correos.length,
      pendientes: correos.filter(
        (c) => normalizeEstado(c.estado) === "Pendiente"
      ).length,
      enProceso: correos.filter(
        (c) => normalizeEstado(c.estado) === "En proceso"
      ).length,
      completados: correos.filter(
        (c) => normalizeEstado(c.estado) === "Completado"
      ).length,
      mios: correos.filter((c) => c.asignado === user?.fullName).length,
    };
  }, [correos, user]);

  // Clic en correo
  const handleClick = (correo: Correo) => {
    if (!user) return;

    if (correo.asignado === user.fullName) {
      router.push(`/dashboard/correos/owa_detalle/${correo.idCorreo}`);
      return;
    }

    if (normalizeEstado(correo.estado) === "Pendiente") {
      setSelectedCorreo(correo);
      setOpenDialog(true);
    }
  };

  // Autoasignar
  const handleAutoAsignar = async () => {
    if (!selectedCorreo || !user) return;

    setLoading(true);
    try {
      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/asignar/${selectedCorreo.idCorreo}`,
        { user_id: user.id }
      );

      setCorreos((prev) =>
        prev.map((c) =>
          c.id === selectedCorreo.id
            ? { ...c, estado: "En proceso", asignado: user.fullName }
            : c
        )
      );

      setOpenDialog(false);
      router.push(`/dashboard/correos/owa_detalle/${selectedCorreo.idCorreo}`);
    } catch (err) {
      console.error("Error autoasignando:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderEstado = (estado: string) => {
    const estadoNorm = normalizeEstado(estado);
    switch (estadoNorm) {
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
      default:
        return <Badge variant="secondary">{estadoNorm}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros por estado */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant={
              estadoFilter === "Todos" && !showOnlyMine ? "default" : "outline"
            }
            className="cursor-pointer"
            onClick={() => {
              setEstadoFilter("Todos");
              setShowOnlyMine(false);
            }}
          >
            Todos ({contadores.todos})
          </Badge>
          <Badge
            variant={estadoFilter === "Pendiente" ? "default" : "outline"}
            className="cursor-pointer border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
            onClick={() => setEstadoFilter("Pendiente")}
          >
            Pendientes ({contadores.pendientes})
          </Badge>
          <Badge
            variant={estadoFilter === "En proceso" ? "default" : "outline"}
            className="cursor-pointer border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
            onClick={() => setEstadoFilter("En proceso")}
          >
            En proceso ({contadores.enProceso})
          </Badge>
          <Badge
            variant={estadoFilter === "Completado" ? "default" : "outline"}
            className="cursor-pointer border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
            onClick={() => setEstadoFilter("Completado")}
          >
            Completados ({contadores.completados})
          </Badge>

          {/* Separador */}
          <div className="mx-2 h-6 w-px bg-border" />

          {/* Filtro "Solo míos" */}
          <Badge
            variant={showOnlyMine ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setShowOnlyMine(!showOnlyMine)}
          >
            <User className="mr-1 h-3 w-3" />
            Mis correos ({contadores.mios})
          </Badge>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold">Asunto</TableHead>
              <TableHead className="font-semibold">Intención</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Asignado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {correosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron correos
                </TableCell>
              </TableRow>
            ) : (
              correosFiltrados.map((correo) => {
                const esMio = correo.asignado === user?.fullName;
                const esClickeable =
                  normalizeEstado(correo.estado) === "Pendiente" || esMio;

                return (
                  <TableRow
                    key={correo.id}
                    onClick={() => handleClick(correo)}
                    className={`transition ${
                      esClickeable ? "cursor-pointer hover:bg-muted/50" : ""
                    } ${
                      esMio ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""
                    }`}
                  >
                    <TableCell className="font-medium">
                      {new Date(correo.fecha).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {esMio && <User className="h-4 w-4 text-blue-600" />}
                        <span className={esMio ? "font-medium" : ""}>
                          {correo.asunto}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {correo.intencion}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderEstado(correo.estado)}</TableCell>
                    <TableCell>
                      {correo.asignado ? (
                        <Badge
                          variant="outline"
                          className={
                            esMio
                              ? "border-blue-300 bg-blue-100 text-blue-700"
                              : "border-gray-300 bg-gray-100 text-gray-700"
                          }
                        >
                          <BadgeCheckIcon className="mr-1" size={14} />
                          {correo.asignado}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
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
                          <DropdownMenuItem variant="destructive">
                            Papelera
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmación */}
      {typeof window !== "undefined" && (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                ¿Deseas autoasignar este correo a ti mismo?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              El correo será marcado como "En proceso" y asignado a{" "}
              <strong>{user?.fullName}</strong>
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleAutoAsignar} disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  "Sí, autoasignar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
