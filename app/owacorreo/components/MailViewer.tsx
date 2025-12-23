"use client";

import { sanitizeOutlookHtml } from "./sanitize";

interface MailViewerProps {
  message: any;
}

export function MailViewer({ message }: MailViewerProps) {
  if (!message) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Selecciona un correo para ver su contenido
      </div>
    );
  }

  const html =
    message.body.contentType === "html"
      ? sanitizeOutlookHtml(message.body.content)
      : message.body.content.replace(/\n/g, "<br />");

  return (
    <div className="flex flex-col h-full">
      <header className="border-b pb-4 mb-4">
        <h1 className="text-xl font-semibold">
          {message.subject || "(Sin asunto)"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {message.from?.emailAddress?.name} —{" "}
          {message.from?.emailAddress?.address}
        </p>
      </header>

      {/* 🔒 AISLAMIENTO TOTAL */}
      <div className="flex-1 overflow-auto">
        <div className="mail-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
