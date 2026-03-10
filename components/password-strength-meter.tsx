"use client"

import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
}

const requirements = [
  { label: "Al menos 6 caracteres", test: (p: string) => p.length >= 6 },
  { label: "Una letra mayuscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Una letra minuscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Un numero", test: (p: string) => /[0-9]/.test(p) }
]

function getStrength(password: string): number {
  if (!password) return 0
  return requirements.filter((r) => r.test(password)).length
}

function getStrengthLabel(strength: number): string {
  if (strength === 0) return ""
  if (strength <= 2) return "Debil"
  if (strength <= 3) return "Regular"
  if (strength <= 4) return "Buena"
  return "Excelente"
}

function getBarColor(strength: number): string {
  if (strength <= 2) return "bg-red-500"
  if (strength <= 3) return "bg-amber-500"
  if (strength <= 4) return "bg-blue-500"
  return "bg-emerald-500"
}

function getLabelColor(strength: number, hasPassword: boolean): string {
  if (!hasPassword) return "text-muted-foreground"
  if (strength <= 2) return "text-red-600"
  if (strength <= 3) return "text-amber-600"
  if (strength <= 4) return "text-blue-600"
  return "text-emerald-600"
}

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const strength = getStrength(password)
  const label = getStrengthLabel(strength)

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Fortaleza</span>
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              getLabelColor(strength, password.length > 0)
            )}
          >
            {label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i < strength ? getBarColor(strength) : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password)
          return (
            <div
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                met ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {met ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <X className="size-3.5 shrink-0 opacity-40" />
              )}
              <span>{req.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
