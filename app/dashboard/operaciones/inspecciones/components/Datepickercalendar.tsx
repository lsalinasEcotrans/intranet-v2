"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerCalendarProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function DatePickerCalendar({
  value,
  onChange,
  label,
  placeholder = "Seleccionar fecha",
}: DatePickerCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(value + "T00:00:00") : new Date(),
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentDate);
    selected.setDate(day);
    const isoString = selected.toISOString().split("T")[0];
    onChange(isoString);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Agregar días vacíos del mes anterior
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Agregar días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const isCurrentMonth =
    selectedDate?.getMonth() === currentDate.getMonth() &&
    selectedDate?.getFullYear() === currentDate.getFullYear();

  return (
    <div className="relative w-full">
      {label && (
        <label className="text-xs font-semibold block mb-2">{label}</label>
      )}

      {/* Input Display */}
      <div
        ref={inputRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span
          className={`text-sm flex-1 ${value ? "text-foreground" : "text-muted-foreground"}`}
        >
          {formatDisplayDate(value)}
        </span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="hover:bg-muted rounded p-0.5 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-lg shadow-lg p-4 w-72 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleMonthChange(-1)}
              className="hover:bg-muted rounded-md p-1.5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1">
              <h3 className="font-semibold text-sm">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="hover:bg-muted rounded-md p-1.5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDateClick(day)}
                disabled={!day}
                className={`
                  aspect-square rounded-md text-sm font-medium transition-colors
                  ${
                    !day
                      ? "cursor-default"
                      : isCurrentMonth && selectedDate?.getDate() === day
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        : day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() ===
                              new Date().getFullYear()
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold"
                          : "hover:bg-muted text-foreground"
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                const today = new Date();
                const isoString = today.toISOString().split("T")[0];
                onChange(isoString);
                setIsOpen(false);
              }}
            >
              Hoy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isoString = tomorrow.toISOString().split("T")[0];
                onChange(isoString);
                setIsOpen(false);
              }}
            >
              Mañana
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
