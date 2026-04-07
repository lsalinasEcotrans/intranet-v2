import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

async function getBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Genera un PDF con inspecciones
 * @param data Array de inspecciones
 * @param fechaDesde Fecha inicial del rango (YYYY-MM-DD)
 * @param fechaHasta Fecha final del rango (YYYY-MM-DD)
 */
export async function generarPDF(
  data: any[],
  fechaDesde: string,
  fechaHasta: string,
) {
  const doc = new jsPDF();

  // ✅ Parsear fechas del rango seleccionado
  const dateFrom = new Date(fechaDesde);
  const dateTo = new Date(fechaHasta);

  // Determinar mes y año para el título
  let titulo = "Vehículos Revisados";

  // Si el rango es dentro del mismo mes
  if (
    dateFrom.getMonth() === dateTo.getMonth() &&
    dateFrom.getFullYear() === dateTo.getFullYear()
  ) {
    const mes = dateFrom.toLocaleString("es-CL", { month: "long" });
    const anio = dateFrom.getFullYear();
    titulo = `Vehículos Revisados ${mes.toUpperCase()} ${anio}`;
  } else {
    // Si el rango abarca múltiples meses, mostrar el período
    const mesDesde = dateFrom.toLocaleString("es-CL", { month: "short" });
    const anioDesde = dateFrom.getFullYear();
    const mesHasta = dateTo.toLocaleString("es-CL", { month: "short" });
    const anioHasta = dateTo.getFullYear();
    titulo = `Vehículos Revisados ${mesDesde.toUpperCase()} ${anioDesde} - ${mesHasta.toUpperCase()} ${anioHasta}`;
  }

  const logoBase64 = await getBase64FromUrl("/logoEcotrans_50px.png");

  // ── Posición del logo ──────────────────────────────
  const logoX = 140;
  const logoY = 4;
  const logoW = 45;
  const logoH = 9;

  // ── Título y tabla se calculan desde el logo ───────
  const titleY = logoY + logoH + 10; // 4 + 9 + 10 = 23
  const tableY = titleY + 10; // 23 + 10 = 33

  const chunkSize = 20; // 20 registros por página

  for (let i = 0; i < data.length; i += chunkSize) {
    if (i > 0) doc.addPage();

    const chunk = data.slice(i, i + chunkSize);

    // Logo primero
    doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);

    // Título debajo del logo
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(titulo, 105, titleY, { align: "center" });

    // Período de exportación
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const periodText = `Período: ${dateFrom.toLocaleDateString(
      "es-CL",
    )} a ${dateTo.toLocaleDateString("es-CL")}`;
    doc.text(periodText, 105, titleY + 6, { align: "center" });
    doc.setTextColor(0);

    // Tabla debajo del título
    autoTable(doc, {
      startY: tableY + 3,
      head: [["Móvil", "Patente", "Fecha Revisión", "Conductor", "Vehículo"]],
      body: chunk.map((item) => [
        item.callsign || "—",
        item.registration || "—",
        new Date(item.fecha_creacion).toLocaleDateString("es-CL"),
        `${(item.forename || "").trim()} ${(item.surname || "").trim()}`.trim() ||
          "—",
        `${(item.make || "").trim()} ${(item.model || "").trim()}`.trim() ||
          "—",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: 0,
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: tableY + 3, left: 10, right: 10, bottom: 20 },
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    const pageCount = Math.ceil(data.length / chunkSize);
    const currentPage = Math.floor(i / chunkSize) + 1;
    doc.text(
      `Página ${currentPage} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 20,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" },
    );

    // Fecha de generación
    const generatedDate = new Date().toLocaleDateString("es-CL");
    doc.text(
      `Generado: ${generatedDate}`,
      10,
      doc.internal.pageSize.getHeight() - 10,
    );
  }

  // ✅ Nombre del archivo mejorado con fecha
  const mesFile = dateFrom.toLocaleString("es-CL", { month: "2-digit" });
  const anioFile = dateFrom.getFullYear();
  doc.save(`inspecciones_${anioFile}-${mesFile}.pdf`);
}
