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

export async function generarPDF(data: any[]) {
  const doc = new jsPDF();
  const fecha = new Date();
  const mes = fecha.toLocaleString("es-CL", { month: "long" });
  const anio = fecha.getFullYear();

  const logoBase64 = await getBase64FromUrl("/logoEcotrans_50px.png");

  // ── Posición del logo ──────────────────────────────
  const logoX = 140;
  const logoY = 4;
  const logoW = 45;
  const logoH = 9;

  // ── Título y tabla se calculan desde el logo ───────
  const titleY = logoY + logoH + 10;  // 4 + 10 + 6 = 20
  const tableY = titleY + 10;         // 20 + 6 = 26

  const chunkSize = 20;

  for (let i = 0; i < data.length; i += chunkSize) {
    if (i > 0) doc.addPage();
    const chunk = data.slice(i, i + chunkSize);

    // Logo primero
    doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);

    // Título debajo del logo
    doc.setFontSize(14);
    doc.text(
      `Vehículos Revisados ${mes.toUpperCase()} ${anio}`,
      105, titleY,
      { align: "center" }
    );

    // Tabla debajo del título
    autoTable(doc, {
      startY: tableY,
      head: [["Móvil", "Patente", "Fecha Revisión", "Conductor", "Vehículo"]],
      body: chunk.map((item) => [
        item.callsign,
        item.registration,
        new Date(item.fecha_creacion).toLocaleDateString("es-CL"),
        `${item.forename || ""} ${item.surname || ""}`,
        `${item.make || ""} ${item.model || ""}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.setFontSize(8);
    doc.text(`Página ${i / chunkSize + 1}`, 180, 290);
  }

  doc.save(`inspecciones_${mes}_${anio}.pdf`);
}