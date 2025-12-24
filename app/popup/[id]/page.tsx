"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export default function OWAPopupRouter() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [idOwa, setIdOwa] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1️⃣ Obtener idOwa
  useEffect(() => {
    if (!id) return;

    const fetchIdOwa = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/detalle/${id}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Error al obtener idOwa");
        }

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
      setError(null);
      try {
        const res = await fetch("/api/owa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: idOwa }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error al leer correo");
        }

        setEmailData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCorreo();
  }, [idOwa]);

  // 🔄 Bloquear scroll del body (comportamiento modal)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm">
          <h2 className="text-xl font-bold truncate">Detalle de Correo</h2>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && <p>Cargando...</p>}

          {error && <p className="text-red-500 font-medium">Error: {error}</p>}

          {!loading && emailData && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* From / Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Remitente
                  </p>
                  <p className="font-medium">
                    {emailData?.from?.emailAddress?.name ?? "Desconocido"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Correo
                  </p>
                  <p className="font-medium">
                    {emailData?.from?.emailAddress?.address ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Fecha
                  </p>
                  <p className="font-medium">
                    {emailData?.receivedDateTime
                      ? new Date(emailData.receivedDateTime).toLocaleString(
                          "es-CL",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Asunto
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  {emailData?.subject || "(Sin asunto)"}
                </h3>
              </div>

              {/* Body */}
              <div className="border rounded-lg overflow-hidden bg-card">
                <iframe
                  className="w-full h-96"
                  sandbox="allow-same-origin"
                  srcDoc={
                    emailData?.body?.content ||
                    '<p style="padding:20px;color:#999">(Sin contenido)</p>'
                  }
                />
              </div>

              {/* Attachments */}
              {Array.isArray(emailData?.attachments) &&
                emailData.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Archivos Adjuntos</h4>
                    <div className="space-y-2">
                      {emailData.attachments.map((file: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.size
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : ""}
                            </p>
                          </div>

                          {file.dataUrl && (
                            <a href={file.dataUrl} download={file.name}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Descargar
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
