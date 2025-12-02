"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

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

interface CorreoNormalizado extends Correo {
  estadoNormalizado: string;
  fechaTimestamp: number;
  esMio: boolean;
}

type EstadoFilter = "Todos" | "Pendiente" | "En proceso" | "Completado";

// ✅ Función de normalización fuera del componente
const normalizeEstado = (estado: string): string => {
  if (estado === "1" || estado === "Pendiente") return "Pendiente";
  if (estado === "3" || estado === "En proceso") return "En proceso";
  if (estado === "4" || estado === "Completado") return "Completado";
  return estado;
};

export default function CorreosTable() {
  const [user, setUser] = useState<UserData | null>(null);
  const [correos, setCorreos] = useState<Correo[]>([]);
  const [selectedCorreo, setSelectedCorreo] = useState<Correo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);

    axios
      .get(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/headers"
      )
      .then((res) => setCorreos(res.data))
      .catch((err) => console.error("Error cargando correos:", err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Pre-procesar correos con datos normalizados (SE CALCULA UNA SOLA VEZ)
  const correosNormalizados = useMemo<CorreoNormalizado[]>(() => {
    return correos.map((correo) => ({
      ...correo,
      estadoNormalizado: normalizeEstado(correo.estado),
      fechaTimestamp: new Date(correo.fecha).getTime(),
      esMio: correo.asignado === user?.fullName,
    }));
  }, [correos, user?.fullName]);

  // ✅ Contar correos SOLO cuando cambien los correos normalizados
  const contadores = useMemo(() => {
    const todos = correosNormalizados.length;
    let pendientes = 0;
    let enProceso = 0;
    let completados = 0;
    let mios = 0;

    // Una sola iteración para calcular todos los contadores
    correosNormalizados.forEach((c) => {
      if (c.estadoNormalizado === "Pendiente") pendientes++;
      if (c.estadoNormalizado === "En proceso") enProceso++;
      if (c.estadoNormalizado === "Completado") completados++;
      if (c.esMio) mios++;
    });

    return { todos, pendientes, enProceso, completados, mios };
  }, [correosNormalizados]);

  // ✅ Filtrar y ordenar correos (OPTIMIZADO)
  const correosFiltrados = useMemo(() => {
    let filtered = correosNormalizados;

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        c.asunto.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (estadoFilter !== "Todos") {
      filtered = filtered.filter((c) => c.estadoNormalizado === estadoFilter);
    }

    // Filtro "solo míos"
    if (showOnlyMine) {
      filtered = filtered.filter((c) => c.esMio);
    }

    // Ordenar: primero los del usuario, luego por fecha (DESC)
    return filtered.sort((a, b) => {
      if (a.esMio && !b.esMio) return -1;
      if (!a.esMio && b.esMio) return 1;
      return b.fechaTimestamp - a.fechaTimestamp;
    });
  }, [correosNormalizados, searchTerm, estadoFilter, showOnlyMine]);

  // ✅ Callbacks memoizados
  const handleClick = useCallback(
    (correo: CorreoNormalizado) => {
      if (!user) return;

      const intencionParam = encodeURIComponent(correo.intencion);

      if (correo.esMio) {
        router.push(
          `/dashboard/correos/owa_detalle/${correo.idCorreo}?intencion=${intencionParam}`
        );
        return;
      }

      if (correo.estadoNormalizado === "Pendiente") {
        setSelectedCorreo(correo);
        setOpenDialog(true);
      }
    },
    [user, router]
  );

  const handleAutoAsignar = useCallback(async () => {
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
      router.push(
        `/dashboard/correos/owa_detalle/${
          selectedCorreo.idCorreo
        }?intencion=${encodeURIComponent(selectedCorreo.intencion)}`
      );
    } catch (err) {
      console.error("Error autoasignando:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCorreo, user, router]);

  // ✅ Componente memoizado para badges de estado
  const renderEstado = useCallback((estadoNorm: string) => {
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
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="mx-2 h-6 w-px bg-border" />

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

      {/* Skeleton de tabla */}
      {loading ? (
        <div className="w-full overflow-x-auto rounded-lg border bg-white p-4 shadow-sm space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border bg-white shadow-sm">
          <Table className="min-w-max">
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
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron correos
                  </TableCell>
                </TableRow>
              ) : (
                correosFiltrados.map((correo) => {
                  const esClickeable =
                    (correo.estadoNormalizado === "Pendiente" ||
                      correo.esMio) &&
                    correo.estadoNormalizado !== "Completado";

                  return (
                    <TableRow
                      key={correo.id}
                      onClick={() => esClickeable && handleClick(correo)}
                      className={`transition ${
                        esClickeable
                          ? "cursor-pointer hover:bg-muted/50"
                          : "cursor-not-allowed"
                      } ${
                        correo.esMio
                          ? "border-l-4 border-l-blue-500 bg-blue-50/30"
                          : ""
                      }`}
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
                          {correo.esMio && (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                          <span className={correo.esMio ? "font-medium" : ""}>
                            {correo.asunto}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {correo.intencion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderEstado(correo.estadoNormalizado)}
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
                            <DropdownMenuItem>Papelera</DropdownMenuItem>
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
      )}

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
