import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://ecotrans-intranet-370980788525.europe-west1.run.app";
const PAGE_SIZE = 100; // Límite máximo del backend

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const allowedParams = ["search", "estado", "fecha_desde", "fecha_hasta"];

    // ✅ Construir parámetros base (SIN page_size ni page)
    const baseParams = new URLSearchParams();
    for (const key of allowedParams) {
      const value = searchParams.get(key);
      if (value) baseParams.set(key, value);
    }

    // ✅ PAGINACIÓN MANUAL: Traer todos los registros en lotes de 100
    let allItems = [];
    let page = 1;
    let hasMore = true;

    console.log(
      "[export] Iniciando paginación con parámetros:",
      baseParams.toString(),
    );

    while (hasMore) {
      const params = new URLSearchParams(baseParams);
      params.set("page_size", String(PAGE_SIZE));
      params.set("page", String(page));

      const url = `${API_URL}/inspecciones?${params.toString()}`;
      console.log(`[export] Página ${page}: ${url}`);

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`[export] API error en página ${page}:`, data);
        return NextResponse.json(data, { status: res.status });
      }

      // Extraer items (pueden venir como array o dentro de {items: []})
      const items = Array.isArray(data) ? data : data.items || [];

      console.log(
        `[export] Página ${page}: ${items.length} registros obtenidos`,
      );

      if (items.length === 0) {
        hasMore = false;
      } else {
        allItems = allItems.concat(items);
        // Si obtuvimos menos de PAGE_SIZE, no hay más páginas
        if (items.length < PAGE_SIZE) {
          hasMore = false;
        }
        page++;
      }
    }

    console.log(`[export] Total de registros: ${allItems.length}`);

    return NextResponse.json({
      items: allItems,
      total: allItems.length,
      count: allItems.length,
    });
  } catch (err) {
    console.error("[export] Error:", err);
    return NextResponse.json(
      { detail: "Error exportando", error: String(err) },
      { status: 500 },
    );
  }
}
