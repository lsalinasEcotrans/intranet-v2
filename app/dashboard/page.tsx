// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Calendar } from "lucide-react";

interface UserData {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Leer datos del usuario de las cookies
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.user_data) {
      try {
        setUser(JSON.parse(decodeURIComponent(cookies.user_data)));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    // Actualizar reloj cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="p-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.fullName || "Usuario"}
        </h2>
        <p className="text-gray-600 mt-2">{formatDate(currentTime)}</p>
      </div>

      <div className="pt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuario</CardTitle>
            <Users className="h-15 w-15 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.username}</div>
            <p className="text-xs text-muted-foreground">ID: {user?.id}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rol</CardTitle>
            <Shield className="h-15 w-15 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.role}</div>
            <p className="text-xs text-muted-foreground">Permisos de acceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesión</CardTitle>
            <Calendar className="h-15 w-15 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Activa</div>
            <p className="text-xs text-muted-foreground">
              Última conexión: Hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Panel de Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Selecciona una opción del menú lateral para comenzar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
