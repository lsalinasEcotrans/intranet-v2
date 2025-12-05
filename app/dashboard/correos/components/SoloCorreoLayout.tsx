"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import EmailViewer from "./email-viewer";
import EmailModal from "./email-modal";

interface EmailFormLayoutProps {
  emailData?: any;
  loading?: boolean;
  error?: string | null;
  intencion: "Reserva" | "otros";
}

export default function EmailFormLayout({
  emailData,
  loading,
  error,
  intencion,
}: EmailFormLayoutProps) {
  const { id } = useParams();
  const [showEmail, setShowEmail] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden bg-zinc-100">
      {/* Panel del correo */}
      <div className="flex-1 overflow-auto">
        <EmailViewer
          emailData={emailData}
          loading={loading}
          onFullscreen={() => setShowFullscreen(true)}
          intencion={intencion}
        />
      </div>
      <EmailModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        emailData={emailData}
      />
    </div>
  );
}
