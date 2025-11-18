'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData?: any;
}

export default function EmailModal({
  isOpen,
  onClose,
  emailData,
}: EmailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background/95 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">
              {emailData?.subject || 'Sin asunto'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              De: {emailData?.from?.emailAddress?.address || 'Desconocido'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Date & From Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Remitente
                </p>
                <p className="font-medium">
                  {emailData?.from?.emailAddress?.address || 'Desconocido'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fecha
                </p>
                <p className="font-medium">
                  {new Date(
                    emailData?.receivedDateTime
                  ).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Asunto
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {emailData?.subject || '(Sin asunto)'}
              </h3>
            </div>

            {/* Email Content */}
            <div className="border rounded-lg overflow-hidden bg-card">
              <iframe
                className="w-full h-96"
                sandbox="allow-same-origin"
                srcDoc={
                  emailData?.body?.content ||
                  '<p style="padding: 20px; color: #999;">(Sin contenido)</p>'
                }
              />
            </div>

            {/* Attachments */}
            {emailData?.attachments && emailData.attachments.length > 0 && (
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
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
