"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type FormState = "loading" | "invalid-token" | "form" | "success" | "error"

export function ChangePasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formState, setFormState] = useState<FormState>("loading")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setFormState("invalid-token")
      return
    }

    async function validateToken() {
      try {
        const response = await fetch("https://ecotranschile.app.n8n.cloud/webhook-test/fc017f18-74bd-4209-baaf-d7b8cb6a6fc9", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "validate", token }),
        })

        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          if (data.valid) {
            setFormState("form")
          } else {
            setFormState("invalid-token")
          }
        } else {
          setFormState("invalid-token")
        }
      } catch {
        setFormState("invalid-token")
      }
    }

    validateToken()
  }, [token])

  const isPasswordValid = (p: string): boolean => {
    return /^(?=.*[A-Z])(?=.*[0-9]).{6,}$/.test(p);
  };

  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0
  const canSubmit =
    isPasswordValid(newPassword) &&
    newPassword.length >= 6 &&
    passwordsMatch &&
    !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !token) return

    setError("")
    setLoading(true)

    try {
      const response = await fetch("https://ecotranschile.app.n8n.cloud/webhook-test/fc017f18-74bd-4209-baaf-d7b8cb6a6fc9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          token,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Error al cambiar la contraseña")
      }

      setFormState("success")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error. Intenta nuevamente."
      )
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (formState === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Invalid or missing token
  if (formState === "invalid-token") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="size-6 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {"Enlace inválido"}
          </CardTitle>
          <CardDescription className="text-center">
            {"Este enlace para cambiar contraseña no es válido o ha expirado. Solicita uno nuevo desde tu cuenta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 size-4" />
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (formState === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {"Contraseña actualizada"}
          </CardTitle>
          <CardDescription className="text-center">
            {"Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.location.href = "/login"}
            className="w-full"
          >
            Ir a iniciar sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Form
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Nueva contraseña
        </CardTitle>
        <CardDescription className="text-center">
          {"Ingresa tu nueva contraseña de acceso"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showNew ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showNew ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {newPassword.length > 0 && (
              <PasswordStrengthMeter password={newPassword} />
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                disabled={loading}
                className={cn(
                  confirmPassword.length > 0 &&
                    !passwordsMatch &&
                    "border-destructive focus-visible:ring-destructive/30"
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-sm text-destructive">
                {"Las contraseñas no coinciden"}
              </p>
            )}
            {passwordsMatch && (
              <p className="text-sm text-emerald-600">
                {"Las contraseñas coinciden"}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {"Actualizando..."}
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
