"use client";

import { useParams } from "next/navigation";
import axios from "axios";

import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmailAvatar } from "@/components/email-avatar";
import { Mail, Maximize2 } from "lucide-react";

import { CompleteButton } from "./owa-actions/CompleteButton";
import { SpamButton } from "./owa-actions/MarkAsSpamButton";
import { PendingButton } from "./owa-actions/WaitingResponseButton";
import { ReplyButton } from "./owa-actions/ReplyButton";

interface EmailViewerProps {
  emailData?: any;
  loading?: boolean;
  intencion: "Reserva" | "otros";
  onFullscreen?: () => void;
}

export default function EmailViewer({
  emailData,
  loading,
  intencion,
  onFullscreen,
}: EmailViewerProps) {
  const params = useParams();

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

  const senderEmail =
    emailData.from?.emailAddress?.address || "noemail@example.com";
  const senderName = emailData.from?.emailAddress?.name || "Remitente";

  return (
    <div className="p-6 space-y-6">
      {/* Asunto Correo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {emailData?.subject || "Sin asunto"}
              </h2>
            </div>
            {/* <Button
              variant="outline"
              size="icon"
              onClick={onFullscreen}
              title="Ver a pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </Button> */}
            <Button
              variant="outline"
              size="icon"
              title="Abrir en ventana popup"
              onClick={() => {
                window.open(
                  `/popup/${params.id}?intencion=${intencion}&popup=true`,
                  "owa-popup",
                  "width=1200,height=800,resizable=yes,scrollbars=yes"
                );
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>
      {/* Cuerpo de Correo con Avatar del Remitente */}
      <Card className="@container/card">
        <CardHeader>
          <div className="flex items-start justify-between gap-6">
            {/* Left side: Avatar + Name + Email */}
            <div className="flex items-start gap-4 flex-1">
              <EmailAvatar email={senderEmail} size="lg" />
              <div className="flex-1">
                <p className="text-xl font-semibold">{senderName}</p>
                <p className="text-md text-muted-foreground font-mono">
                  {senderEmail}
                </p>
                <p className="text-md text-muted-foreground">
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

            {/* Right side: Buttons + Date */}
            {intencion === "Reserva" ? (
              <></>
            ) : (
              <div className="flex flex-col items-end gap-3">
                <ButtonGroup>
                  <CompleteButton
                    emailId={emailData.id} // Este se usa para Informar
                    onNoInform={async () => {
                      try {
                        await axios.put(
                          `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${params.id}`,
                          { estado: 2 }
                        );
                      } catch (error) {
                        console.error("Error actualizando estado:", error);
                      }
                    }}
                  />
                  <SpamButton
                    emailId={emailData.id} // Este se usa para Informar
                    onNoInform={async () => {
                      try {
                        await axios.put(
                          `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${params.id}`,
                          { estado: 6 }
                        );
                      } catch (error) {
                        console.error("Error actualizando estado:", error);
                      }
                    }}
                  />
                  <PendingButton
                    emailId={emailData.id} // Este se usa para Informar
                    onNoInform={async () => {
                      try {
                        await axios.put(
                          `https://ecotrans-intranet-370980788525.europe-west1.run.app/headers/estado/${params.id}`,
                          { estado: 5 }
                        );
                      } catch (error) {
                        console.error("Error actualizando estado:", error);
                      }
                    }}
                  />
                  <ReplyButton
                    emailId={emailData.id}
                    rowId={params.id as string}
                  />
                </ButtonGroup>
              </div>
            )}
          </div>
        </CardHeader>
        <Separator className="my-4" />
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <iframe
            className="w-full h-130"
            sandbox="allow-same-origin"
            srcDoc={
              emailData.body?.content ||
              '<p style="padding: 20px; color: #999;">(Sin contenido)</p>'
            }
          />
        </CardFooter>
      </Card>
    </div>
  );
}
