"use client";

import React, { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  MapPin,
  Clock,
  User,
  Hash,
  Phone,
  Briefcase,
  Building2,
  Navigation,
  Loader2,
} from "lucide-react";
import axios from "axios";

interface AddPasajeroDialogProps {
  onSuccess: () => void;
}

interface Suggestion {
  description: string;
  place_id: string | null;
  fullAddress?: any;
  customAddressID?: number | null;
}

function getUserFromCookie() {
  const cookies = document.cookie.split("; ");
  const userCookie = cookies.find((row) => row.startsWith("user_data="));

  if (!userCookie) return null;

  try {
    const value = userCookie.split("=")[1];
    const decoded = decodeURIComponent(value);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error parseando cookie user_data", error);
    return null;
  }
}

export function AddPasajeroDialog({ onSuccess }: AddPasajeroDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentRequest = useRef(0);
  const searchParams = useSearchParams();
  const turno = searchParams.get("turno");

  const initialForm = {
    grupo_numero: "",
    rut: "",
    nombre: "",
    contacto: "",
    rol: "",
    turno: "",
    centro_costo: "",
    direccion_origen: "",
    hora_programada: "",
    direccion_destino: "",
  };

  const [form, setForm] = useState(initialForm);

  const [origenSuggestions, setOrigenSuggestions] = useState<Suggestion[]>([]);
  const [destinoSuggestions, setDestinoSuggestions] = useState<Suggestion[]>(
    [],
  );

  const [latOrigen, setLatOrigen] = useState<number | null>(null);
  const [lngOrigen, setLngOrigen] = useState<number | null>(null);
  const [latDestino, setLatDestino] = useState<number | null>(null);
  const [lngDestino, setLngDestino] = useState<number | null>(null);

  function resetForm() {
    setForm(initialForm);
    setLatOrigen(null);
    setLngOrigen(null);
    setLatDestino(null);
    setLngDestino(null);
    setOrigenSuggestions([]);
    setDestinoSuggestions([]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    } catch (error) {
      console.error("Error autocomplete:", error);
      toast.error("Error buscando direccion");
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
          `/api/ghost/details?placeID=${encodeURIComponent(
            suggestion.place_id,
          )}`,
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
        }));
        setLatOrigen(lat);
        setLngOrigen(lng);
        setOrigenSuggestions([]);
      } else {
        setForm((prev) => ({
          ...prev,
          direccion_destino: suggestion.description,
        }));
        setLatDestino(lat);
        setLngDestino(lng);
        setDestinoSuggestions([]);
      }
    } catch (error) {
      console.error("Error details:", error);
      toast.error("Error obteniendo detalles de direccion");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    const user = getUserFromCookie();
    const username = user?.username || "system";
    e.preventDefault();

    if (loading) return;

    if (
      latOrigen === null ||
      lngOrigen === null ||
      latDestino === null ||
      lngDestino === null
    ) {
      toast.error("Debes seleccionar direcciones validas desde la lista");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Guardando pasajero...");

    try {
      const payload = {
        rut: form.rut,
        grupo_numero: form.grupo_numero,
        nombre: form.nombre,
        contacto: form.contacto,
        rol: form.rol,
        turno: form.turno,
        centro_costo:
          form.centro_costo.trim() !== "" ? form.centro_costo : null,
        direccion_origen: form.direccion_origen,
        latitud_origen: latOrigen,
        longitud_origen: lngOrigen,
        hora_programada: form.hora_programada,
        direccion_destino: form.direccion_destino,
        latitud_destino: latDestino,
        longitud_destino: lngDestino,
        // 👇 NUEVO
        user_log: username,
      };

      await axios.post(
        "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros/",
        payload,
      );

      toast.dismiss(loadingToast);
      toast.success(`Pasajero ${form.nombre} creado correctamente`);

      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al crear pasajero");
    } finally {
      setLoading(false);
    }
  }

  const esTurnoH = form.turno === "TurnoH";
  const grupoHoraObligatorio = form.turno === "TurnoH";
  const grupoHoraOpcional = form.turno === "4x4" || form.turno === "7x7";

  function handleHoraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (raw.length === 0) {
      setForm((prev) => ({ ...prev, hora_programada: "" }));
      return;
    }

    let hh = raw.slice(0, 2);
    let mm = raw.slice(2, 4);

    // Clamp hours to 0-23
    if (hh.length === 2) {
      const hhNum = parseInt(hh, 10);
      if (hhNum > 23) hh = "23";
    }
    // First digit can only be 0, 1, or 2
    if (hh.length === 1 && parseInt(hh, 10) > 2) {
      hh = "0" + hh;
      mm = raw.slice(1, 3);
    }

    // Clamp minutes to 0-59
    if (mm.length === 2) {
      const mmNum = parseInt(mm, 10);
      if (mmNum > 59) mm = "59";
    }
    if (mm.length === 1 && parseInt(mm, 10) > 5) {
      mm = "5" + mm.charAt(0);
    }

    let formatted = hh;
    if (raw.length > 2) {
      formatted = hh + ":" + mm;
    }

    setForm((prev) => ({ ...prev, hora_programada: formatted }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <UserPlus className="size-4" />
          Ingresar Pasajero
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Nuevo Pasajero</DialogTitle>
              <DialogDescription>
                Completa la informacion para registrar un nuevo pasajero.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-2">
            {/* Section: Informacion Personal */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Informacion Personal
                </h3>
              </div>
              <Separator />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label
                  htmlFor="rut"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  RUT <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="rut"
                    name="rut"
                    placeholder="123456789"
                    value={form.rut}
                    onChange={handleChange}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Juan Perez"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="contacto"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Contacto <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="contacto"
                    name="contacto"
                    placeholder="912345678"
                    value={form.contacto}
                    onChange={handleChange}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="rol"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Rol
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="rol"
                    name="rol"
                    placeholder="Operador"
                    value={form.rol}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Section: Direcciones */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Direcciones
                </h3>
              </div>
              <Separator />
            </div>

            <div className="grid gap-4 mb-6">
              {/* Origen */}
              <div className="space-y-2 relative">
                <Label
                  htmlFor="direccion_origen"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Origen <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
                  <Input
                    id="direccion_origen"
                    name="direccion_origen"
                    placeholder="Buscar direccion de origen..."
                    value={form.direccion_origen}
                    onChange={(e) => {
                      handleChange(e);
                      handleAutocomplete(e.target.value, "origen");
                    }}
                    required
                    className="pl-9"
                  />
                  {latOrigen !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </div>
                {origenSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
                    {origenSuggestions.map((s, i) => (
                      <button
                        type="button"
                        key={`${s.description}-${i}`}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-accent cursor-pointer text-left"
                        onClick={() => handleSelect(s, "origen")}
                      >
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Visual connector */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="size-1.5 rounded-full bg-border" />
                  <div className="h-3 w-px bg-border" />
                  <div className="size-1.5 rounded-full bg-border" />
                </div>
              </div>
              {/* Destino */}
              <div className="space-y-2 relative">
                <Label
                  htmlFor="direccion_destino"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Destino <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
                  <Input
                    id="direccion_destino"
                    name="direccion_destino"
                    placeholder="Buscar direccion de destino..."
                    value={form.direccion_destino}
                    onChange={(e) => {
                      handleChange(e);
                      handleAutocomplete(e.target.value, "destino");
                    }}
                    required
                    className="pl-9"
                  />
                  {latDestino !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </div>
                {destinoSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
                    {destinoSuggestions.map((s, i) => (
                      <button
                        type="button"
                        key={`${s.description}-${i}`}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-accent cursor-pointer text-left"
                        onClick={() => handleSelect(s, "destino")}
                      >
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section: Turno y Asignacion */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  Turno y Asignacion
                </h3>
              </div>
              <Separator />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div className="space-y-2">
                <Label
                  htmlFor="turno"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Turno <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.turno}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      turno: value,
                    }))
                  }
                  required
                >
                  <SelectTrigger id="turno" className="w-full">
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Turnos disponibles</SelectLabel>
                      <SelectItem value="TurnoH">
                        <span className="flex items-center gap-2">Turno H</span>
                      </SelectItem>
                      <SelectItem value="4x4">
                        <span className="flex items-center gap-2">4x4</span>
                      </SelectItem>
                      <SelectItem value="7x7">
                        <span className="flex items-center gap-2">7x7</span>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="centro_costo"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Centro de Costo
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="centro_costo"
                    name="centro_costo"
                    placeholder="CC-001"
                    value={form.centro_costo}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="grupo_numero"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Grupo
                  {grupoHoraObligatorio && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                  {grupoHoraOpcional && (
                    <span className="ml-1 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                      (opcional)
                    </span>
                  )}
                </Label>
                <Input
                  id="grupo_numero"
                  name="grupo_numero"
                  type="text"
                  placeholder="1"
                  value={form.grupo_numero}
                  onChange={handleChange}
                  required={grupoHoraObligatorio}
                />
                {!form.turno && (
                  <p className="text-[11px] text-muted-foreground/60">
                    Selecciona un turno primero
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="hora_programada"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Hora Programada
                  {grupoHoraObligatorio && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                  {grupoHoraOpcional && (
                    <span className="ml-1 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                      (opcional)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="hora_programada"
                    name="hora_programada"
                    placeholder="HH:MM"
                    value={form.hora_programada}
                    onChange={handleHoraChange}
                    maxLength={5}
                    inputMode="numeric"
                    required={grupoHoraObligatorio}
                    className="pl-9 font-mono tracking-widest"
                  />
                  {form.hora_programada.length === 5 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                    </div>
                  )}
                </div>
                {!form.turno && (
                  <p className="text-[11px] text-muted-foreground/60">
                    Selecciona un turno primero
                  </p>
                )}
                {form.turno && (
                  <p className="text-[11px] text-muted-foreground/60">
                    Formato 24 hrs. Ej: 06:00, 14:30, 23:00
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="min-w-160px">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Guardar Pasajero
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
