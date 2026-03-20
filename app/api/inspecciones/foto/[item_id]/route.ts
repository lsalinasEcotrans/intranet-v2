// app/api/inspecciones/foto/[item_id]/route.ts
// Proxy que sirve las imágenes de OneDrive via Cloud Run
// El frontend usa /api/inspecciones/foto/<item_id> como src

import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app"!;

export async function GET(
  req: NextRequest,
  { params }: { params: { item_id: string } }
) {
  try {
    const res = await fetch(`${API_URL}/inspecciones/foto/${params.item_id}`);
    if (!res.ok) {
      return NextResponse.json({ detail: "Foto no encontrada" }, { status: 404 });
    }
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[foto proxy]", err);
    return NextResponse.json({ detail: "Error interno" }, { status: 500 });
  }
}