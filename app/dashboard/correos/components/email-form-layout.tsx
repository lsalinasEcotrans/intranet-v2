"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import OWAForm from "./owa/OWAForm";

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
  const [showEmail, setShowEmail] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const { id } = useParams();

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden bg-zinc-100">
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
                intencion={intencion}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowEmail(!showEmail)}
          className="w-10 flex-shrink-0 border-r flex items-center justify-center hover:bg-accent transition-colors group bg-gray-50"
          aria-label={showEmail ? "Ocultar correo" : "Mostrar correo"}
        >
          {showEmail ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          )}
        </button>

        <div className="flex-1 overflow-auto bg-slate-100">
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
            <OWAForm id={id as string} />
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
