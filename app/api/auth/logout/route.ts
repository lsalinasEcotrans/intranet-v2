// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Eliminar todas las cookies de sesión
    cookieStore.delete("auth_token");
    cookieStore.delete("user_data");
    cookieStore.delete("user_menu");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
