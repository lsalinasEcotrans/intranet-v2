"use client"

import { useState } from "react"
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
import { Loader2, CheckCircle2, ArrowLeft, Mail } from "lucide-react"

type FormState = "form" | "success" | "error"

interface ForgotPasswordFormProps {
  /** URL del endpoint donde se enviara el correo por POST */
  endpoint?: string
}

export function ForgotPasswordForm({ 
  endpoint = "https://ecotranschile.app.n8n.cloud/webhook-test/fc017f18-74bd-4209-baaf-d7b8cb6a6fc9" 
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [formState, setFormState] = useState<FormState>("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = isValidEmail && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError("")
    setLoading(true)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forgot-password",
          email,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Error al enviar el correo")
      }

      setFormState("success")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrio un error. Intenta nuevamente."
      )
    } finally {
      setLoading(false)
    }
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
            Correo enviado
          </CardTitle>
          <CardDescription className="text-center">
            Si existe una cuenta asociada a <span className="font-medium text-foreground">{email}</span>, recibiras un correo con las instrucciones para restablecer tu contrasena.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Revisa tu bandeja de entrada y la carpeta de spam.
          </p>
          <Button
            onClick={() => window.location.href = "/login"}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 size-4" />
            Volver al inicio de sesion
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Form
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="size-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Recuperar contrasena
        </CardTitle>
        <CardDescription className="text-center">
          Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contrasena.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
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
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperacion"
            )}
          </Button>

          <div className="text-center">
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Volver al inicio de sesion
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
