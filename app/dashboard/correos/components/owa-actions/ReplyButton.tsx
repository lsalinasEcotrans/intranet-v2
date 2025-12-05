"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "@tinymce/tinymce-react";
import { Reply, Loader2, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";

interface ReplyButtonProps {
  emailId: string;
  rowId: string;
}

type SendStatus = "idle" | "sending" | "success" | "error";

export function ReplyButton({ emailId, rowId }: ReplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(true);

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
      const res = await axios.put("/api/owa", {
        messageId: emailId,
        replyBody: editorContent,
      });

      if (res.status !== 200) throw new Error("Error al enviar");

      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${rowId}`,
        {
          estado: 5,
        }
      );

      setSendStatus("success");

      // Redirigir después de mostrar el mensaje de éxito
      setTimeout(() => {
        setOpen(false);
        setEditorContent("");
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
    if (sendStatus === "sending") return; // No cerrar mientras se envía
    setOpen(false);
    setSendStatus("idle");
    setSendError(null);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Reply className="h-4 w-4" />
        Responder
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-7xl"
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
                        Enviando correo...
                      </h3>
                      <p className="text-muted-foreground">
                        Por favor, espera mientras se envía tu respuesta
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
                        ¡Correo enviado!
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
            <DialogTitle>Responder correo</DialogTitle>
          </DialogHeader>

          {editorLoading && (
            <div className="w-full">
              <Skeleton className="h-[450px] w-full rounded-lg" />
            </div>
          )}

          <div
            className={
              editorLoading
                ? "hidden"
                : "mt-4 border rounded-lg overflow-hidden"
            }
          >
            <Editor
              apiKey="ko3uc7v3s2ivzoljqm36krk01nf2l4i37b58h0irm57fd6dz"
              initialValue=""
              value={editorContent}
              onEditorChange={(content) => setEditorContent(content)}
              onInit={() => setEditorLoading(false)}
              init={{
                height: 450,
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
              }}
            />
          </div>

          {sendStatus === "error" && sendError && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{sendError}</p>
            </div>
          )}

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
                !editorContent.trim()
              }
            >
              {sendStatus === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
