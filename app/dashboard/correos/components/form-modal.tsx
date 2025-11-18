"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData?: any;
}

export default function FormModal({
  isOpen,
  onClose,
  emailData,
}: FormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Formulario en Pantalla Completa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* From */}
          <div className="space-y-2">
            <label className="text-sm font-medium">De</label>
            <Input
              value={emailData?.from?.emailAddress?.address || ""}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Asunto</label>
            <Input
              defaultValue={emailData?.subject || ""}
              placeholder="Asunto del correo"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Recibida</label>
            <Input
              value={
                emailData?.receivedDateTime
                  ? new Date(emailData.receivedDateTime).toLocaleString("es-ES")
                  : ""
              }
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select defaultValue="general">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="seguimiento">Seguimiento</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select defaultValue="pendiente">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="procesado">Procesado</SelectItem>
                <SelectItem value="archivado">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea
              className="w-full min-h-24 px-3 py-2 border rounded-md border-input bg-background placeholder:text-muted-foreground"
              placeholder="Añade notas adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1">Guardar</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
