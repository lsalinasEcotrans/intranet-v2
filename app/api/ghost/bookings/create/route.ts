import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const response = await axios.post(
      "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/bookings/",
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "Authentication-Token": `Bearer ${token}`,
        },
      }
    );

    // 👇 AHORA VIENE ASÍ
    // { id: 849786 }
    const bookingId = response.data?.id;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Respuesta inválida del API Ghost" },
        { status: 500 }
      );
    }

    // Cookie temporal (30 min)
    cookieStore.set({
      name: "bookingNumber",
      value: String(bookingId),
      httpOnly: false, // true si no necesitas leerla en el cliente
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    return NextResponse.json({ bookingId });
  } catch (err: any) {
    console.error("Error creando booking:", err.response?.data || err.message);

    return NextResponse.json(
      { error: "Error al crear booking" },
      { status: 500 }
    );
  }
}
