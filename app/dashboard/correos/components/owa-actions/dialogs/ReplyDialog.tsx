"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LexicalEditor from "../LexicalEditor";

export default function ReplyDialog() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");

  return (
    <>
      {/* BOTÓN QUE ABRE EL DIALOG */}
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Responder
      </Button>

      {/* DIALOG BLOQUEADO */}
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Responder correo</DialogTitle>
          </DialogHeader>

          {/* EDITOR LEXICAL */}
          <LexicalEditor value={content} onChange={setContent} />

          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={() => console.log("Enviar:", content)}>
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
