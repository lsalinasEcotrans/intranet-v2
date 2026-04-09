import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app";

// ==========================================
// Helper seguro para fetch
// ==========================================
async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data,
    };
  }

  return {
    ok: true,
    status: res.status,
    data,
  };
}

// ==========================================
// GET - LISTADO
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = new URLSearchParams();

    const allowedParams = [
      "page",
      "page_size",
      "search",
      "estado",
      "fecha_desde",
      "fecha_hasta",
    ];

    for (const key of allowedParams) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        params.set(key, value);
      }
    }

    const url = `${API_URL}/inspecciones/${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const result = await safeFetch(url, {
      method: "GET",
      cache: "no-store", // 🔥 evita cache en dashboards
    });

    if (!result.ok) {
      return NextResponse.json(
        result.data || { detail: "Error backend" },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);

  } catch (err) {
    console.error("[inspecciones GET]", err);

    return NextResponse.json(
      { detail: "Error interno" },
      { status: 500 }
    );
  }
}

// ==========================================
// POST - CREAR INSPECCIÓN
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const result = await safeFetch(`${API_URL}/inspecciones/`, {
      method: "POST",
      body: formData,
    });

    if (!result.ok) {
      return NextResponse.json(
        result.data || { detail: "Error backend" },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 201 });

  } catch (err) {
    console.error("[inspecciones POST]", err);

    return NextResponse.json(
      { detail: "Error interno" },
      { status: 500 }
    );
  }
}