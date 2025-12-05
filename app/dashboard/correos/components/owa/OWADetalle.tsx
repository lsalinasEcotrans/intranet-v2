"use client";

import { useEffect, useState } from "react";
import EmailFormLayout from "../email-form-layout";
import SoloCorreoLayout from "../SoloCorreoLayout";

interface OWADetalleProps {
  id: string;
  intencion: "Reserva" | "otros";
}

export default function OWADetalle({ id, intencion }: OWADetalleProps) {
  const [idOwa, setIdOwa] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1️⃣ Obtener idOwa
  useEffect(() => {
    if (!id) return;

    const fetchIdOwa = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/detalle/${id}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error al obtener idOwa");
        setIdOwa(data.idOwa);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIdOwa();
  }, [id]);

  // 2️⃣ Leer el correo desde /api/owa
  useEffect(() => {
    if (!idOwa) return;

    const fetchCorreo = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/owa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: idOwa }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al leer correo");
        setEmailData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCorreo();
  }, [idOwa]);

  // 3️⃣ Render según intención
  return (
    <main className="h-screen">
      {intencion === "Reserva" ? (
        <EmailFormLayout
          emailData={emailData}
          loading={loading}
          error={error}
          intencion={intencion}
        />
      ) : (
        <SoloCorreoLayout
          emailData={emailData}
          loading={loading}
          error={error}
          intencion={intencion}
        />
      )}
    </main>
  );
}
