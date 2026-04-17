import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase() || "";

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 },
      );
    }

    const url =
      "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/customers";

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": `Bearer ${token}`,
      },
    });

    const data = response.data;

    // 🔥 FILTRO
    const filtered = data.filter((item: any) => {
      return (
        item.displayName?.toLowerCase().includes(q) ||
        item.accountCode?.toLowerCase().includes(q)
      );
    });

    // 🔥 limitar resultados (importante)
    return NextResponse.json(filtered.slice(0, 20));
  } catch (err) {
    console.error("Error en search:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
