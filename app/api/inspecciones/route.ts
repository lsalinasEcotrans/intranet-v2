// app/api/inspecciones/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app"!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    // Pasar todos los query params al backend
    ["page", "page_size", "search", "estado", "fecha_desde", "fecha_hasta"].forEach((k) => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });

    const res = await fetch(`${API_URL}/inspecciones/?${params}`);
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[inspecciones GET]", err);
    return NextResponse.json({ detail: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${API_URL}/inspecciones/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[inspecciones POST]", err);
    return NextResponse.json({ detail: "Error interno" }, { status: 500 });
  }
}
