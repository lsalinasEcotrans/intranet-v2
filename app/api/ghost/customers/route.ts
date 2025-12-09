import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // PETICIÓN AXIOS
    // -----------------------------------------
    const url =
      "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/customers";

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": `Bearer ${token}`,
      },
    });

    // Axios ya parsea JSON → response.data
    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Error en GET customers:", err);

    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
