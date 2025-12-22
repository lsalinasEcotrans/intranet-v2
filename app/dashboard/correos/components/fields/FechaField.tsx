"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { es } from "react-day-picker/locale";

interface FechaTimePickerProps {
  value?: string; // Ej: "2025-11-08T09:30:00-04:00"
  onChange?: (v: string) => void; // Devuelve ISO parcial: "YYYY-MM-DDTHH:mm"
}

const DateTimePicker = ({ value, onChange }: FechaTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string>(""); // "YYYY-MM-DD"
  const [time, setTime] = useState("00:00");
  const [error, setError] = useState("");

  // Parsear fecha ISO respetando la hora original
  const parseDateTime = (iso?: string) => {
    if (!iso) return { datePart: "", hour: "00", minute: "00" };
    const [datePart, timePart] = iso.split("T");
    const [hour, minute] = timePart.split(":");
    return { datePart, hour, minute };
  };

  // Inicializar desde value
  useEffect(() => {
    if (value) {
      const { datePart, hour, minute } = parseDateTime(value);
      setDate(datePart);
      setTime(`${hour}:${minute}`);
    }
  }, [value]);

  // Combina fecha y hora en ISO parcial
  const triggerChange = (newDate?: string, newTime?: string) => {
    const d = newDate || date;
    const t = newTime || time;
    if (!d || t.length !== 5) return;
    onChange?.(`${d}T${t}`);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val === "") {
      setTime("");
      setError("");
      return;
    }

    val = val.replace(/[^0-9:]/g, "");

    if (val.length >= 2 && !val.includes(":")) {
      val = val.slice(0, 2) + ":" + val.slice(2, 4);
    }

    if (val.length > 5) val = val.slice(0, 5);

    setTime(val);

    if (val.length === 5) {
      const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!regex.test(val)) {
        setError("Formato inválido. Usa HH:mm (0-23 horas)");
      } else {
        setError("");
        triggerChange(undefined, val);
      }
    } else {
      setError("");
    }
  };

  const handleTimeBlur = () => {
    if (time && time.length > 0 && time.length < 5) {
      setError("Completa el formato HH:mm");
    }
  };

  // Función para mostrar fecha en formato chileno
  const formatDateCL = (d: string) => {
    if (!d) return "";
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex gap-4 w-full">
      {/* Fecha */}
      <div className="flex flex-col gap-3 flex-1">
        <Label htmlFor="date-picker" className="px-1">
          Fecha
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="justify-between font-normal w-full bg-transparent"
            >
              {date ? formatDateCL(date) : "Pick a date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full overflow-hidden p-0" align="start">
            <Calendar
              animate
              locale={es}
              mode="single"
              selected={date ? new Date(date) : undefined}
              onSelect={(d) => {
                if (!d) return;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const newDate = `${y}-${m}-${day}`;
                setDate(newDate);
                setOpen(false);
                triggerChange(newDate);
              }}
              disabled={{ before: new Date() }}
              className="w-full"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Hora */}
      <div className="flex flex-col gap-3 flex-1">
        <Label htmlFor="time-picker" className="px-1">
          Hora (24hrs)
        </Label>
        <div className="flex flex-col gap-1">
          <Input
            type="text"
            id="time-picker"
            placeholder="HH:mm"
            value={time}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            maxLength={5}
            className={`w-full font-mono text-center ${
              error ? "border-red-500 focus:border-red-500" : ""
            }`}
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;
