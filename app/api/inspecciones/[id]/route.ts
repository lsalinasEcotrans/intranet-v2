// app/api/inspecciones/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const res = await fetch(`${API_URL}/inspecciones/${id}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[inspecciones/[id] GET]", err);
    return NextResponse.json(
      { detail: "Error interno" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const res = await fetch(`${API_URL}/inspecciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[inspecciones/[id] PUT]", err);
    return NextResponse.json(
      { detail: "Error interno" },
      { status: 500 }
    );
  }
}