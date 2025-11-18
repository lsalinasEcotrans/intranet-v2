"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import EmailViewer from "./email-viewer";
import EmailModal from "./email-modal";
import FormModal from "./form-modal";

interface EmailFormLayoutProps {
  emailData?: any;
  loading?: boolean;
  error?: string | null;
}

export default function EmailFormLayout({
  emailData,
  loading,
  error,
}: EmailFormLayoutProps) {
  const [showEmail, setShowEmail] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        <div
          className={`flex-shrink-0 border-r transition-all duration-300 overflow-hidden ${
            showEmail ? "w-1/2" : "w-0"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <EmailViewer
                emailData={emailData}
                loading={loading}
                onFullscreen={() => setShowFullscreen(true)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowEmail(!showEmail)}
          className="w-10 flex-shrink-0 border-r flex items-center justify-center hover:bg-accent transition-colors group"
          aria-label={showEmail ? "Ocultar correo" : "Mostrar correo"}
        >
          {showEmail ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          )}
        </button>

        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Procesar Correo
                </h1>
                <p className="text-muted-foreground mt-1">
                  Completa el formulario con la información del correo
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFormModal(true)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalles del Correo</CardTitle>
                <CardDescription>
                  Información extraída y campos para completar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* From Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">De</label>
                  <Input
                    value={emailData?.from?.emailAddress?.address || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                {/* Subject Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asunto</label>
                  <Input
                    defaultValue={emailData?.subject || ""}
                    placeholder="Asunto del correo"
                  />
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Recibida</label>
                  <Input
                    value={
                      emailData?.receivedDateTime
                        ? new Date(emailData.receivedDateTime).toLocaleString(
                            "es-ES"
                          )
                        : ""
                    }
                    readOnly
                    className="bg-muted"
                  />
                </div>

                {/* Category Select */}
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

                {/* Status Select */}
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
                    className="w-full min-h-24 px-3 py-2 border rounded-md border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Añade notas adicionales..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">Guardar</Button>
                  <Button variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EmailModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        emailData={emailData}
      />
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        emailData={emailData}
      />
    </>
  );
}
