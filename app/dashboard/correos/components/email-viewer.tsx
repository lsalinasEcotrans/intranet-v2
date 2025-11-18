"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Clock,
  Calendar,
  User,
  FileText,
  Download,
  Maximize2,
} from "lucide-react";

interface EmailViewerProps {
  emailData?: any;
  loading?: boolean;
  onFullscreen?: () => void;
}

export default function EmailViewer({
  emailData,
  loading,
  onFullscreen,
}: EmailViewerProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!emailData) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto opacity-50 mb-4" />
          <p>No hay correo cargado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {emailData?.subject || "Sin asunto"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreen}
            title="Ver a pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left Column - Email Details */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Card className="border shadow-sm">
              <CardContent className="pt-6 space-y-6">
                {/* From Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      De
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {emailData.from?.emailAddress?.name || "Remitente"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emailData.from?.emailAddress?.address || "Desconocido"}
                    </p>
                  </div>
                </div>

                {/* Date Section */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      Fecha de recepción
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(
                        emailData.receivedDateTime || new Date()
                      ).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Attachments */}
          {emailData.attachments && emailData.attachments.length > 0 && (
            <div className="lg:col-span-2">
              <Card className="border shadow-sm h-full">
                <div className="text-sm flex items-center gap-2 px-8">
                  <FileText className="w-4 h-4" />
                  <span>Archivos Adjuntos</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {emailData.attachments!.length}
                  </Badge>
                </div>
                <CardContent className="">
                  <div className="space-y-2">
                    {emailData.attachments!.map((file: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium text-xs truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <div className="flex gap-1 items-center mt-2">
                              <Badge variant="outline" className="text-xs">
                                {file.contentType
                                  ?.split("/")[1]
                                  ?.toUpperCase() || "FILE"}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="w-full mt-2"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar</span>
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Email Content Preview */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <iframe
          className="w-full h-130"
          sandbox="allow-same-origin"
          srcDoc={
            emailData.body?.content ||
            '<p style="padding: 20px; color: #999;">(Sin contenido)</p>'
          }
        />
      </div>
    </div>
  );
}
