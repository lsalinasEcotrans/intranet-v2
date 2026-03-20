import { cookies } from "next/headers";

const BASE_URL = "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const registration = searchParams.get("registration");

    if (!registration) {
      return Response.json(
        { error: "registration requerido" },
        { status: 400 }
      );
    }

    // 🔐 Token desde cookie (como ya usas)
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return Response.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const headers = {
      "Authentication-Token": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // ===============================
    // 1. OBTENER VEHÍCULOS
    // ===============================
    const responseVehiculos = await fetch(
      `${BASE_URL}/api/v1/vehicles`,
      {
        method: "GET",
        headers,
      }
    );

    if (!responseVehiculos.ok) {
      return Response.json(
        { error: "Error al obtener vehículos" },
        { status: responseVehiculos.status }
      );
    }

    const vehiculos = await responseVehiculos.json();

    // 🔎 Normalizar búsqueda
    const registroBuscado = registration.trim().toUpperCase();

    const vehiculo = vehiculos.find(
      (v: any) =>
        v.registration?.toUpperCase() === registroBuscado
    );

    if (!vehiculo) {
      return Response.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      );
    }

    // ===============================
    // 2. OBTENER DRIVER
    // ===============================
    const responseDriver = await fetch(
      `${BASE_URL}/api/ghost/v1/drivers/${vehiculo.ownerDriverId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!responseDriver.ok) {
      return Response.json(
        { error: "Error al obtener conductor" },
        { status: responseDriver.status }
      );
    }

    const driver = await responseDriver.json();

    // ===============================
    // RESPUESTA FINAL
    // ===============================
    return Response.json({
      vehiculo,
      driver,
    });

  } catch (error) {
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}