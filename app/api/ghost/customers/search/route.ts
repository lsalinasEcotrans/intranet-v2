// route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";

    if (q.length < 1) return NextResponse.json([]);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const response = await axios.get(
      "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/customers",
      {
        headers: {
          "Authentication-Token": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      },
    );

    // Validamos si la respuesta es un array o un objeto único
    const rawData = response.data;
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];

    const filtered = dataArray.filter((item: any) => {
      // Forzamos a String y minúsculas para comparar "banco" con "BANCO DE CHILE"
      const name = String(item.displayName || "").toLowerCase();
      const code = String(item.accountCode || "").toLowerCase();

      return name.includes(q) || code.includes(q);
    });

    // Mapeamos solo lo que el Form necesita para no saturar el frontend
    const results = filtered.slice(0, 15).map((item: any) => ({
      id: item.id,
      displayName: item.displayName,
      accountCode: item.accountCode,
    }));

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}
