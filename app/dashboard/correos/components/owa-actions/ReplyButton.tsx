"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "@tinymce/tinymce-react";
import { Reply } from "lucide-react";
import axios from "axios";

interface ReplyButtonProps {
  emailId: string;
  rowId: string;
}

export function ReplyButton({ emailId, rowId }: ReplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(true); // 👈 loader editor

  async function handleSend() {
    if (!editorContent.trim()) return;
    if (!emailId) {
      setSendError("No se recibió un ID válido para responder.");
      return;
    }

    setSending(true);
    setSendError(null);
    setSent(false);

    try {
      const res = await axios.put("/api/owa", {
        messageId: emailId,
        replyBody: editorContent,
      });

      if (res.status !== 200) throw new Error("Error al enviar");

      await axios.put(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${rowId}`,
        { estado: 5 }
      );

      setSent(true);

      setTimeout(() => {
        setOpen(false);
        setEditorContent("");
      }, 1000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setSendError(err.response.data.error);
      } else {
        setSendError(err.message || "Error inesperado");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Reply className="h-4 w-4" />
        Responder
      </Button>

      <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
        <DialogContent
          className="sm:max-w-7xl"
          // 👇 evita que se cierre al hacer clic fuera o presionar ESC
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Responder correo</DialogTitle>
          </DialogHeader>

          {/* Loader mientras TinyMCE se inicializa */}
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
              onInit={() => setEditorLoading(false)} // 👈 ocultar el loader
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

          {/* mensajes de estado */}
          <div className="mt-2 min-h-6">
            {sending && <p className="text-blue-600 text-sm">⏳ Enviando...</p>}
            {sent && (
              <p className="text-green-600 text-sm">
                ✔ Respuesta enviada correctamente
              </p>
            )}
            {sendError && <p className="text-red-500 text-sm">⚠ {sendError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : "Enviar respuesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
