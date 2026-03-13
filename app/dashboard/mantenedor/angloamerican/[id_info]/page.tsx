"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  Save,
  MapPin,
  Navigation,
  Loader2,
  Check,
  UserPlus,
  Clock,
  User,
  Hash,
  Phone,
  Briefcase,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const MapPreview = dynamic(() => import("../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

function segundosAHora(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface Suggestion {
  description: string;
  place_id: string | null;
  fullAddress?: any;
  customAddressID?: number | null;
}

interface FormData {
  rut: string;
  nombre: string;
  contacto: string;
  rol: string;
  turno: string;
  grupo_numero: string;
  centro_costo: string;
  direccion_origen: string;
  latitud_origen: number | null;
  longitud_origen: number | null;
  hora_programada: string;
  direccion_destino: string;
  latitud_destino: number | null;
  longitud_destino: number | null;
}

export default function EditarPasajeroPage() {
  const { id_info } = useParams<{ id_info: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    rut: "",
    nombre: "",
    contacto: "",
    rol: "",
    turno: "",
    grupo_numero: "",
    centro_costo: "",
    direccion_origen: "",
    latitud_origen: null,
    longitud_origen: null,
    hora_programada: "",
    direccion_destino: "",
    latitud_destino: null,
    longitud_destino: null,
  });

  const [origenSuggestions, setOrigenSuggestions] = useState<Suggestion[]>([]);
  const [destinoSuggestions, setDestinoSuggestions] = useState<Suggestion[]>(
    [],
  );
  const currentRequest = useRef(0);

  useEffect(() => {
    const fetchPasajero = async () => {
      try {
        const res = await axios.get(`/api/pasajeros/${id_info}`);
        const raw = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!raw) {
          setError("No se encontró el pasajero.");
          return;
        }

        setForm({
          rut: raw.rut,
          nombre: raw.nombre,
          contacto: raw.contacto,
          rol: raw.rol,
          turno: raw.turno,
          grupo_numero: String(raw.grupo_numero),
          centro_costo: raw.centro_costo,
          direccion_origen: raw.direccion_origen,
          latitud_origen: raw.latitud_origen,
          longitud_origen: raw.longitud_origen,
          hora_programada: segundosAHora(raw.hora_programada),
          direccion_destino: raw.direccion_destino,
          latitud_destino: raw.latitud_destino,
          longitud_destino: raw.longitud_destino,
        });
      } catch (err) {
        console.error("Error cargando pasajero:", err);
        setError("No se pudo cargar el pasajero.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasajero();
  }, [id_info]);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAutocomplete(text: string, type: "origen" | "destino") {
    if (text.length < 3) {
      type === "origen" ? setOrigenSuggestions([]) : setDestinoSuggestions([]);
      return;
    }

    const requestId = ++currentRequest.current;

    try {
      const res = await axios.get(
        `/api/ghost/autocomplete?text=${encodeURIComponent(text)}`,
      );

      if (requestId !== currentRequest.current) return;

      const results = res.data?.searchResults ?? [];
      const mappedResults = results.map((item: any) => ({
        description: item.address,
        place_id: item.placeID,
        fullAddress: item.fullAddress,
        customAddressID: item.customAddressID,
      }));

      type === "origen"
        ? setOrigenSuggestions(mappedResults)
        : setDestinoSuggestions(mappedResults);
    } catch {
      toast.error("Error buscando dirección");
    }
  }

  async function handleSelect(
    suggestion: Suggestion,
    type: "origen" | "destino",
  ) {
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (suggestion.fullAddress?.coordinate) {
        lat = suggestion.fullAddress.coordinate.latitude;
        lng = suggestion.fullAddress.coordinate.longitude;
      } else if (suggestion.place_id) {
        const res = await axios.get(
          `/api/ghost/details?placeID=${encodeURIComponent(suggestion.place_id)}`,
        );
        lat = res.data?.coordinate?.latitude;
        lng = res.data?.coordinate?.longitude;
      }

      if (lat == null || lng == null) {
        toast.error("No se pudieron obtener coordenadas");
        return;
      }

      if (type === "origen") {
        setForm((prev) => ({
          ...prev,
          direccion_origen: suggestion.description,
          latitud_origen: lat,
          longitud_origen: lng,
        }));
        setOrigenSuggestions([]);
      } else {
        setForm((prev) => ({
          ...prev,
          direccion_destino: suggestion.description,
          latitud_destino: lat,
          longitud_destino: lng,
        }));
        setDestinoSuggestions([]);
      }
    } catch {
      toast.error("Error obteniendo detalles de dirección");
    }
  }

  async function handleSave() {
    if (
      form.latitud_origen === null ||
      form.longitud_origen === null ||
      form.latitud_destino === null ||
      form.longitud_destino === null
    ) {
      toast.error("Las coordenadas de origen y destino son requeridas");
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`/api/pasajeros/${id_info}`, {
        rut: form.rut,
        nombre: form.nombre,
        contacto: form.contacto,
        rol: form.rol,
        turno: form.turno,
        grupo_numero: form.grupo_numero,
        centro_costo: form.centro_costo,
        direccion_origen: form.direccion_origen,
        latitud_origen: form.latitud_origen,
        longitud_origen: form.longitud_origen,
        hora_programada: `${form.hora_programada}:00`,
        direccion_destino: form.direccion_destino,
        latitud_destino: form.latitud_destino,
        longitud_destino: form.longitud_destino,
      });
      toast.success("Pasajero actualizado correctamente");
      router.back();
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetPassword() {
    setIsResetting(true);
    try {
      await axios.patch(`/api/pasajeros/${id_info}/reset-password`);
      toast.success("Contraseña reseteada correctamente");
    } catch {
      toast.error("Error al resetear la contraseña");
    } finally {
      setIsResetting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">
            Cargando información del pasajero...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mt-4"
            >
              Volver atrás
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-6 relative">
      {/* Overlay de carga al guardar */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Guardando cambios...
              </p>
              <p className="text-sm text-muted-foreground">Por favor espera</p>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER (ancho completo) ── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Editar Pasajero</h1>
          <p className="text-sm text-muted-foreground">ID #{id_info}</p>
        </div>
        {/* Acciones en el header */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isResetting}>
              {isResetting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              Resetear contraseña
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Resetear contraseña?</AlertDialogTitle>
              <AlertDialogDescription>
                Se restablecerá la contraseña de <strong>{form.nombre}</strong>.
                El pasajero deberá usar sus credenciales por defecto para volver
                a ingresar. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword}>
                Sí, resetear contraseña
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          onClick={() => router.back()}
          variant="outline"
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-36">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {/* ── CONTENIDO: 2 columnas ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* COLUMNA IZQUIERDA — Formulario */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos del pasajero</CardTitle>
              <CardDescription>
                Modifica los campos necesarios y guarda los cambios.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              {/* ─── INFORMACIÓN PERSONAL ─── */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    Información Personal
                  </h3>
                </div>
                <Separator />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>RUT</Label>
                  <Input
                    value={form.rut}
                    onChange={(e) => handleChange("rut", e.target.value)}
                    placeholder="12345678-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Contacto</Label>
                  <Input
                    value={form.contacto}
                    onChange={(e) => handleChange("contacto", e.target.value)}
                    placeholder="+56912345678"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <Input
                    value={form.rol}
                    onChange={(e) => handleChange("rol", e.target.value)}
                  />
                </div>
              </div>

              {/* ─── TURNO Y ASIGNACIÓN ─── */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    Turno y Asignación
                  </h3>
                </div>
                <Separator />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Turno</Label>
                  <Select
                    value={form.turno}
                    onValueChange={(val) => handleChange("turno", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TurnoH">Turno H</SelectItem>
                      <SelectItem value="4x4">4x4</SelectItem>
                      <SelectItem value="7x7">7x7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Grupo N°</Label>
                  <Input
                    value={form.grupo_numero}
                    onChange={(e) =>
                      handleChange("grupo_numero", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Centro de costo</Label>
                  <Input
                    value={form.centro_costo}
                    onChange={(e) =>
                      handleChange("centro_costo", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Hora programada</Label>
                  <Input
                    type="time"
                    value={form.hora_programada}
                    onChange={(e) =>
                      handleChange("hora_programada", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* ─── DIRECCIONES ─── */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    Direcciones
                  </h3>
                </div>
                <Separator />
              </div>

              <div className="grid gap-4">
                {/* Dirección origen */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <Label>Dirección de origen</Label>
                    {form.latitud_origen !== null && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Check className="h-3 w-3" />
                        Ubicación confirmada
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />

                    <Input
                      value={form.direccion_origen}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          direccion_origen: e.target.value,
                          latitud_origen: null,
                          longitud_origen: null,
                        }));
                        handleAutocomplete(e.target.value, "origen");
                      }}
                      className={`pl-9 pr-10 ${
                        form.latitud_origen !== null
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                          : ""
                      }`}
                      placeholder="Buscar dirección de origen..."
                    />

                    {form.latitud_origen !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                    )}
                  </div>

                  {origenSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
                      {origenSuggestions.map((s, i) => (
                        <button
                          key={`${s.description}-${i}`}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"
                          onClick={() => handleSelect(s, "origen")}
                        >
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span className="truncate">{s.description}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {form.latitud_origen === null && form.direccion_origen && (
                    <p className="text-[11px] text-amber-500">
                      Selecciona una dirección de la lista para confirmar las
                      coordenadas
                    </p>
                  )}
                </div>

                {/* Dirección destino */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <Label>Dirección de destino</Label>
                    {form.latitud_destino !== null && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Check className="h-3 w-3" />
                        Ubicación confirmada
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-500" />

                    <Input
                      value={form.direccion_destino}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          direccion_destino: e.target.value,
                          latitud_destino: null,
                          longitud_destino: null,
                        }));
                        handleAutocomplete(e.target.value, "destino");
                      }}
                      className={`pl-9 pr-10 ${
                        form.latitud_destino !== null
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                          : ""
                      }`}
                      placeholder="Buscar dirección de destino..."
                    />

                    {form.latitud_destino !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="h-5 w-5 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA — Mapa */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card className="overflow-hidden border shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-emerald-50/60 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    Ubicación de origen
                  </span>
                </div>
                {form.direccion_origen && form.latitud_origen !== null && (
                  <p className="text-xs text-muted-foreground truncate mt-1 leading-relaxed">
                    {form.direccion_origen}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0 h-80">
                <MapPreview
                  lat={form.latitud_origen}
                  lng={form.longitud_origen}
                  label={form.direccion_origen || "Origen"}
                  color="emerald"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
