"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Editor } from "@tinymce/tinymce-react";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";
import axios from "axios";

/* =========================================================
   Tipos
========================================================= */
type UserData = {
  fullName: string;
  cargo: string;
  departamento: string;
  username: string;
  nexterno?: string | null;
};

type SendStatus = "idle" | "sending" | "success" | "error";

interface InformarButtonProps {
  emailId: string;
}

/* =========================================================
   Utilidades
========================================================= */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

function buildSignatureHTML(user: UserData): string {
  const email = `${user.username.toLowerCase()}@ecotranschile.cl`;
  const phone =
    user.nexterno && user.nexterno.trim() !== "" ? user.nexterno : "227132000";

  return `
<br><br>
---
<table
  width="600"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="font-family: Arial, sans-serif; font-size:12px; color:#333; border-collapse:collapse; border:0;"
>
  <tr>
    <td
      width="40%"
      style="padding-right:10px; vertical-align:top; border:0;"
    >
      <p style="margin:0; font-size:16px; font-weight:bold; color:#0a6e3f;">
        ${user.fullName}
      </p>

      <p style="margin:0; font-size:12px; color:#555;">
        ${user.cargo} | ${user.departamento}
      </p>

      <img
        src="https://www.ecotranschile.cl/img/logoEcotrans_50px.png"
        alt="Logo Ecotrans"
        style="height:50px; border:0; display:block;"
      />
    </td>

    <td
      width="60%"
      style="padding-left:10px; vertical-align:top; border:0;"
    >
      <p style="margin:0; font-size:12px; color:#555;">
        📞 ${phone}
      </p>

      <p style="margin:0; font-size:12px; color:#555;">
        ✉️
        <a
          href="mailto:${email}"
          style="color:#0a6e3f; text-decoration:none;"
        >
          ${email}
        </a>
      </p>

      <p style="margin:0; font-size:12px; color:#555;">
        🌐
        <a
          href="https://www.ecotranschile.cl"
          style="color:#0a6e3f; text-decoration:none;"
        >
          www.ecotranschile.cl
        </a>
      </p>
    </td>
  </tr>

  <tr>
    <td
      colspan="2"
      style="padding-top:15px; background-color:#f2f7f2; border-radius:6px; padding:8px; border:0;"
    >
      <img
        src="https://www.ecotranschile.cl/img/qr_apps.jpg"
        alt="QREcotrans"
        width="90"
        height="90"
        style="display:inline-block; vertical-align:middle; margin-right:10px; border:0;"
      />

      <div
        style="display:inline-block; vertical-align:middle; max-width:440px; line-height:1.3; font-size:12px; color:#555;"
      >
        <h2
          style="font-style: italic; font-weight: bold; margin: 0; color: #6C9E3C; font-size:14px;"
        >
          Nuevos canales de atención
        </h2>

        Queremos estar más cerca de ti, habilitando nuevos canales de atención.<br />
        Visítanos en
        <a
          href="https://apps.ecotranschile.cl/"
          style="color:#0a6e3f; text-decoration:none;"
        >
          apps.ecotranschile.cl
        </a><br />
        O escanea el código QR para acceder directamente.
      </div>
    </td>
  </tr>
</table>
`;
}

function buildBookingHTML(booking: any): string {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      confirmada: { bg: "#d1fae5", text: "#065f46" },
      pendiente: { bg: "#fef3c7", text: "#92400e" },
      cancelada: { bg: "#fee2e2", text: "#991b1b" },
      completada: { bg: "#dbeafe", text: "#1e40af" },
    };
    const color = colors[status?.toLowerCase()] || {
      bg: "#f3f4f6",
      text: "#374151",
    };
    return `<span style="background-color: ${color.bg}; color: ${color.text}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; display: inline-block;">${status}</span>`;
  };

  const formatPickupTime = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch (e) {
      return isoDate;
    }
  };

  return `
<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
  <!-- Encabezado -->
  <div style="background: linear-gradient(to right, #eff6ff, #e0e7ff); border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td colspan="2" style="vertical-align: top;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">ID de Reserva</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #111827;">#${
            booking.id
          }</p>
        </td>
        
      </tr>
    </table>
  </div>

  <!-- Información del Pasajero -->
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
      👤 Información del Pasajero
    </h3>
    <table width="100%" cellpadding="8" cellspacing="0" border="0">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">Pasajero</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${
            booking.passengerName
          }</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">Teléfono</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${
            booking.phone
          }</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Detalles del Viaje -->
  <div style="margin-bottom: 20px;">
    <h3 style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
      🚗 Detalles del Viaje
    </h3>
    <table width="100%" cellpadding="8" cellspacing="0" border="0">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">Hora de Pickup</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${formatPickupTime(
            booking.pickupTime
          )}</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">📍 Origen</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${
            booking.pickupAddress
          }</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">📍 Destino</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${
            booking.destinationAddress
          }</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f9fafb; border-radius: 6px; padding: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280;">Número de Pasajeros</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${
            booking.passengers
          } ${booking.passengers === 1 ? "persona" : "personas"}</p>
        </td>
      </tr>
    </table>
  </div>
</div>
`;
}

/* =========================================================
   Componente
========================================================= */
export function InformarButton({ emailId }: InformarButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const params = useParams();
  const rowId = params?.id as string;

  // Cargar datos del usuario desde cookies
  useEffect(() => {
    const raw = getCookie("user_data");
    if (!raw) return;

    try {
      setUser(JSON.parse(decodeURIComponent(raw)));
    } catch (e) {
      console.error("Error leyendo user_data", e);
    }
  }, []);

  const handleInformar = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ghost/bookings/details");
      if (!res.ok)
        throw new Error("No se pudo cargar la información de la reserva");
      const data = await res.json();
      setBooking(data);

      // Construir el contenido inicial del editor
      if (user) {
        const bookingHTML = buildBookingHTML(data);
        const signatureHTML = buildSignatureHTML(user);
        setEditorContent(bookingHTML + signatureHTML);
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  async function handleSend() {
    if (!editorContent.trim()) return;
    if (!emailId) {
      setSendError("No se recibió un ID válido para responder.");
      setSendStatus("error");
      return;
    }

    setSendStatus("sending");
    setSendError(null);

    try {
      // Enviar respuesta usando la API de OWA
      const res = await axios.put("/api/owa", {
        messageId: emailId,
        replyBody: editorContent,
      });

      if (res.status !== 200) throw new Error("Error al enviar");

      // Actualizar estado del correo en la base de datos
      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${rowId}`,
        {
          estado: 2,
        }
      );

      setSendStatus("success");

      // Redirigir después de mostrar el mensaje de éxito
      setTimeout(() => {
        setOpen(false);
        setEditorContent(user ? buildSignatureHTML(user) : "");
        setSendStatus("idle");
        router.push("/dashboard/correos");
      }, 1500);
    } catch (err: any) {
      setSendStatus("error");
      if (err.response?.data?.error) {
        setSendError(err.response.data.error);
      } else {
        setSendError(err.message || "Error inesperado");
      }
    }
  }

  function handleClose() {
    if (sendStatus === "sending") return;
    setOpen(false);
    setSendStatus("idle");
    setSendError(null);
    setBooking(null);
    setEditorContent("");
  }

  return (
    <>
      <Button className="flex-1" onClick={handleInformar}>
        <Send className="h-4 w-4 mr-2" />
        Informar
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          onInteractOutside={(e) => {
            if (sendStatus === "sending" || sendStatus === "success") {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (sendStatus === "sending" || sendStatus === "success") {
              e.preventDefault();
            }
          }}
        >
          {/* Overlay de estados de envío */}
          {(sendStatus === "sending" || sendStatus === "success") && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                {sendStatus === "sending" && (
                  <>
                    <div className="relative">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        Enviando información...
                      </h3>
                      <p className="text-muted-foreground">
                        Por favor, espera mientras se envía la información
                      </p>
                    </div>
                  </>
                )}
                {sendStatus === "success" && (
                  <>
                    <div className="relative">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-green-600">
                        ¡Información enviada!
                      </h3>
                      <p className="text-muted-foreground">
                        Redirigiendo a la bandeja de correos...
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogHeader>
            <DialogTitle>Informar Detalles de la Reserva</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="space-y-3 py-4">
                <Skeleton className="h-[500px] w-full rounded-lg" />
              </div>
            )}

            {error && !loading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!loading && !error && booking && (
              <>
                {editorLoading && (
                  <Skeleton className="h-[500px] w-full rounded-lg" />
                )}

                <div
                  className={
                    editorLoading
                      ? "hidden"
                      : "border rounded-lg overflow-hidden"
                  }
                >
                  <Editor
                    apiKey="ko3uc7v3s2ivzoljqm36krk01nf2l4i37b58h0irm57fd6dz"
                    value={editorContent}
                    onEditorChange={(content) => setEditorContent(content)}
                    onInit={() => setEditorLoading(false)}
                    init={{
                      height: 500,
                      menubar: false,
                      branding: false,
                      statusbar: false,
                      resize: false,
                      plugins: [
                        "lists",
                        "link",
                        "image",
                        "table",
                        "autolink",
                        "searchreplace",
                        "visualblocks",
                        "wordcount",
                        "code",
                      ],
                      toolbar:
                        "blocks | bold italic underline | forecolor backcolor | " +
                        "fontsize | alignleft aligncenter alignright | bullist numlist | image | code",
                      font_size_formats: "12px 14px 16px 18px 20px 24px 28px",
                      paste_data_images: true,
                      automatic_uploads: true,
                      content_style:
                        "body { font-family: Arial, sans-serif; font-size: 14px; }",
                    }}
                  />
                </div>
              </>
            )}

            {sendStatus === "error" && sendError && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{sendError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={sendStatus === "sending" || sendStatus === "success"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendStatus === "sending" ||
                sendStatus === "success" ||
                !editorContent.trim() ||
                loading
              }
            >
              {sendStatus === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar respuesta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
