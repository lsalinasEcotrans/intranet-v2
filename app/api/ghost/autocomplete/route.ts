import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");

    if (!text) {
      return NextResponse.json(
        { error: "Parámetro text requerido" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 },
      );
    }

    const url = `https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/ghost/v2/autocomplete?companyID=1&text=${encodeURIComponent(
      text,
    )}`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": `Bearer ${token}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Error en autocomplete:", err?.response?.data || err.message);

    return NextResponse.json(
      { error: "Error consultando Autocab" },
      { status: 500 },
    );
  }
}
