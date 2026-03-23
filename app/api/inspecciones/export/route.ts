import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params = new URLSearchParams();

    const allowedParams = [
      "search",
      "estado",
      "fecha_desde",
      "fecha_hasta",
    ];

    for (const key of allowedParams) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }

    const url = `${API_URL}/inspecciones?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // 🔥 devolvemos SOLO items
    return NextResponse.json(data.items);

  } catch (err) {
    console.error("[export]", err);

    return NextResponse.json(
      { detail: "Error exportando" },
      { status: 500 }
    );
  }
}