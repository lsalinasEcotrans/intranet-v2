"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OWADetallePage() {
  const { id } = useParams(); // /dashboard/correos/owa_detalle/[id]
  const [idOwa, setIdOwa] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1️⃣ Obtener el idOwa desde tu API FastAPI
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

  // 2️⃣ Leer correo desde /api/owa
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

  if (loading) return <p className="p-4">Cargando...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  if (!emailData)
    return (
      <div className="p-4">
        <p>No se encontró el correo o aún no se cargó.</p>
        {idOwa && (
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        )}
      </div>
    );

  // 3️⃣ Mostrar el correo con iframe (aislado) + adjuntos
  return (
    <div className="p-8">
      <div className="mt-4 border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Detalles del mensaje</h2>
        <p>
          <strong>Asunto:</strong> {emailData.subject}
        </p>
        <p>
          <strong>De:</strong> {emailData.from?.emailAddress?.address}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(emailData.receivedDateTime).toLocaleString()}
        </p>

        {/* Cuerpo del correo */}
        <div className="mt-3">
          <strong>Cuerpo:</strong>
          <iframe
            className="w-full h-96 border rounded bg-white mt-2"
            sandbox="allow-same-origin"
            srcDoc={emailData.body?.content || "<p>(Sin contenido)</p>"}
          />
        </div>

        {/* Archivos adjuntos */}
        {emailData.attachments && emailData.attachments.length > 0 && (
          <div className="mt-6 border-t pt-3">
            <h3 className="text-md font-semibold mb-2">Archivos adjuntos</h3>
            <ul className="space-y-2">
              {emailData.attachments.map((file: any, idx: number) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white rounded shadow-sm"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.contentType} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <a
                    href={file.dataUrl}
                    download={file.name}
                    className="text-blue-600 hover:underline"
                  >
                    Descargar
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
