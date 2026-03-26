"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";

interface LoginResponse {
  success: boolean;
  error?: string;
  requiresPasswordChange?: boolean;
  redirectTo?: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    correo: string;
    passwordExpiringWarning?: {
      message: string;
      daysLeft: number;
    };
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    try {
      // Validación básica de cliente
      if (!username.trim()) {
        setError("Ingresa tu usuario");
        setLoading(false);
        return;
      }
      if (!password) {
        setError("Ingresa tu contraseña");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      // Manejo de errores específicos
      if (!response.ok) {
        // Si requiere cambio de contraseña
        if (data.requiresPasswordChange && data.redirectTo) {
          setError(data.error || "Acción requerida");
          // Redirigir después de 2 segundos
          setTimeout(() => {
            router.push(data.redirectTo!);
          }, 2000);
          return;
        }

        // Otros errores
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      // Si hay advertencia de contraseña próxima a expirar
      if (data.user?.passwordExpiringWarning) {
        setWarning(
          `⚠️ ${data.user.passwordExpiringWarning.message}. Te recomendamos cambiarla pronto.`,
        );
      }

      // Login exitoso
      if (data.success) {
        // Si hay warning, esperar a que el usuario lo vea
        if (warning) {
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexión con el servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Bienvenido
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/recuperar-contrasena"
                  className="text-sm text-blue-600 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {warning && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {warning}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
