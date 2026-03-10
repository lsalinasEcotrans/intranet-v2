const routeTitles: Record<string, string> = {
  viajes: "Programa de Viajes",
  usuarios: "Usuarios",
  reservas: "Reservas",
};

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  for (const segment of segments) {
    if (routeTitles[segment]) {
      return routeTitles[segment];
    }
  }

  return "Dashboard";
}
