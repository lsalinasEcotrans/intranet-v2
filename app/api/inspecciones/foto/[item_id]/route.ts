// app/api/inspecciones/foto/[item_id]/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app";

type Params = {
  params: Promise<{ item_id: string }>;
};

export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { item_id } = await params;

    const res = await fetch(`${API_URL}/inspecciones/foto/${item_id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { detail: "Foto no encontrada" },
        { status: 404 }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";

    // 🔥 PRO: usar stream en vez de buffer (mejor performance)
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });

  } catch (err) {
    console.error("[foto proxy]", err);

    return NextResponse.json(
      { detail: "Error interno" },
      { status: 500 }
    );
  }
}