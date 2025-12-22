"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Gift, Mail, Users, CheckCircle, AlertCircle } from "lucide-react";

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------
type Participante = {
  name: string;
  email: string;
};

type Asignacion = {
  giver: Participante;
  receiver: Participante;
};

// ------------------------------------------------------------
// LISTAS DE PARTICIPANTES
// ------------------------------------------------------------
const grupoA: Participante[] = [
  { name: "CARLOS ORELLANA", email: "aorellanaalarcon200@gmail.com" },
  { name: "JOSE ZURITA", email: "jzura15@gmail.com" },
  { name: "SCHLOMIT KELLER", email: "slomitkm@gmail.com" },
  { name: "GIANINNA ORTEGA", email: "g.ortega.1287@gmail.com" },
  { name: "LUIS SALINAS", email: "lsalinas059@gmail.com" },
  { name: "JAVIERA CHAPARRO", email: "javierachaparro21@gmail.com" },
  { name: "PAOLA RABANAL", email: "pola.rabanal@hotmail.com" },
  { name: "MICHAEL BRAVO", email: "mako.bravo@gmail.com" },
  { name: "ROBERTO BORIE", email: "rborie@ecotranschile.cl" },
  { name: "JUAN CARLOS GOMEZ", email: "gomez.jcc@gmail.com" },
];

const grupoB: Participante[] = [
  { name: "CARLOS MUÑOZ", email: "carlos2408mu@gmail.com" },
  { name: "SARA MORALES", email: "zari0912@gmail.com" },
  { name: "MARIBEL BARRIA", email: "maribelbarriadelgado@gmail.com" },
  { name: "ROSA ELLEN", email: "rosa_ellen@hotmail.com" },
  { name: "JAIRO VALERA", email: "jairovalera05@gmail.com" },
  { name: "LIDA YAJURE", email: "maryyajure@gmail.com" },
  { name: "PAOLA ALVAREZ", email: "v.alvarez.pa@gmail.com" },
  { name: "RICHARD ESTIPIÑAN", email: "lttoyteq@gmail.com" },
  { name: "IRIS SANDOVAL", email: "irissandoval1523@gmail.com" },
  { name: "KAREN DE LOS SANTOS", email: "karendelossantos961@gmail.com" },
  { name: "DEISY ALVARADO", email: "deisya048@gmail.com" },
  { name: "TAMARA CRUCES", email: "tamaramancilla593@gmail.com" },
  { name: "BETHANIA GUTIERREZ", email: "yoselysgutierrez73@gmail.com" },
  { name: "SUSANA QUITRAL", email: "squitral@ecotranschile.cl" },
  { name: "PATRICIA GOMEZ", email: "gomezcarcamopatricia@gmail.com" },
  { name: "MAURICIO GOMEZ", email: "mgomez@ecotranschile.cl" },
  { name: "JUAN QUITRAL", email: "jquitral@ecotranschile.cl" },
  { name: "ALEX ZUÑIGA", email: "alexzunigatejos@gmail.com" },
  { name: "LAURA HERNANDEZ", email: "correo@correo.cl" },
];

// ------------------------------------------------------------
// FUNCIÓN DE DERANGEMENT MEJORADA
// ------------------------------------------------------------
function derangement<T extends { name: string }>(list: T[]): T[] {
  if (list.length < 2) {
    throw new Error("Se necesitan al menos 2 participantes para el sorteo");
  }

  const maxAttempts = 1000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    if (shuffled.every((x, i) => x.name !== list[i].name)) {
      return shuffled;
    }
    attempts++;
  }

  throw new Error(
    "No se pudo generar un sorteo válido después de múltiples intentos"
  );
}

// ------------------------------------------------------------
// TEMPLATE HTML PARA EMAIL
// ------------------------------------------------------------
function generarEmailHTML(giverName: string, receiverName: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amigo Secreto 2025</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header con degradado -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🎁 Amigo Secreto 2025 🎁
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
                ¡Ha llegado el momento mágico!
              </p>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong style="color: #667eea;">${giverName}</strong>,
              </p>
              
              <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0;">
                ¡Es oficial! El sorteo de Amigo Secreto ha sido realizado y ya tienes asignada a tu persona especial. 
                Recuerda que esto es un secreto y la magia está en mantener la sorpresa hasta el gran día. 🤫
              </p>
              
              <!-- Caja de revelación -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; margin: 30px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="color: #3C4442; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Tu amigo secreto es
                    </p>
                    <p style="color: #6C9E3C; font-size: 28px; font-weight: bold; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      ${receiverName}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Consejos -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #333333; font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">
                  💡 Consejos para un regalo perfecto:
                </p>
                <ul style="color: #555555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Piensa en sus gustos e intereses</li>
                  <li>No es necesario gastar mucho, lo importante es el detalle</li>
                  <li>Un toque personal hace la diferencia</li>
                  <li>El valor sugerido del regalo es alrededor de $10.000 CLP</li>
                  <li>¡Mantén el secreto hasta el final! 🤐</li>
                </ul>
              </div>
              
              <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                ¡Que comience la diversión! 🎉
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 13px; margin: 0; line-height: 1.6;">
                Este correo es confidencial. Por favor, no compartas esta información con nadie.<br>
                <strong>Ecotrans Chile</strong> | Amigo Secreto 2025
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------
export default function AmigoSecretoTombola() {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any>(null);

  const totalParticipantes = grupoA.length + grupoB.length;

  const iniciarTombola = async () => {
    setLoading(true);
    setError(null);
    setResultados(null);

    try {
      // Validar que haya participantes suficientes
      if (grupoA.length < 2 && grupoB.length < 2) {
        throw new Error("Se necesitan al menos 2 participantes por grupo");
      }

      // Generar sorteos solo para grupos con 2+ personas
      const asignaciones: Asignacion[] = [];

      if (grupoA.length >= 2) {
        const resultadoA = derangement(grupoA);
        asignaciones.push(
          ...grupoA.map((giver, i) => ({ giver, receiver: resultadoA[i] }))
        );
      }

      if (grupoB.length >= 2) {
        const resultadoB = derangement(grupoB);
        asignaciones.push(
          ...grupoB.map((giver, i) => ({ giver, receiver: resultadoB[i] }))
        );
      }

      // Preparar datos para envío
      const emailData = asignaciones.map(({ giver, receiver }) => ({
        to: giver.email,
        subject: "🎁 ¡Tu Amigo Secreto ha sido revelado!",
        html: generarEmailHTML(giver.name, receiver.name),
        giverName: giver.name,
        receiverName: receiver.name,
      }));

      console.log(
        "Enviando correos de forma escalonada:",
        emailData.length,
        "correos totales"
      );

      // Enviar correos de 2 en 2 con espera entre lotes
      const batchSize = 2;
      const delay = 1000; // 1 segundo entre lotes
      let exitosos = 0;
      let fallidos = 0;
      const detallesFallidos: any[] = [];

      for (let i = 0; i < emailData.length; i += batchSize) {
        const batch = emailData.slice(i, i + batchSize);
        console.log(
          `📧 Enviando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(
            emailData.length / batchSize
          )} (${batch.length} correos)`
        );

        try {
          const response = await fetch("/api/amigo-secreto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails: batch }),
          });

          const contentType = response.headers.get("content-type");

          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.error(
              "❌ Respuesta no JSON:",
              textResponse.substring(0, 500)
            );
            throw new Error(
              `El servidor devolvió un error (Status ${response.status})`
            );
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Error al enviar el lote");
          }

          exitosos += data.exitosos || batch.length;
          fallidos += data.fallidos || 0;

          if (data.detalles?.fallidos) {
            detallesFallidos.push(...data.detalles.fallidos);
          }

          console.log(
            `✅ Lote ${Math.floor(i / batchSize) + 1} enviado exitosamente`
          );
        } catch (error) {
          console.error(
            `❌ Error en lote ${Math.floor(i / batchSize) + 1}:`,
            error
          );
          // Marcar todos los correos del lote como fallidos
          fallidos += batch.length;
          batch.forEach((email) => {
            detallesFallidos.push({
              to: email.to,
              error:
                error instanceof Error ? error.message : "Error desconocido",
            });
          });
        }

        // Esperar antes del siguiente lote (excepto en el último)
        if (i + batchSize < emailData.length) {
          console.log(`⏳ Esperando ${delay}ms antes del siguiente lote...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Preparar resultados finales
      const resultadosFinales = {
        exitosos,
        fallidos,
        total: emailData.length,
        detalles: {
          fallidos: detallesFallidos,
        },
      };

      console.log("📊 Resultado final:", resultadosFinales);
      setResultados(resultadosFinales);
      setDialogOpen(true);
    } catch (error) {
      console.error("❌ Error completo:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Tómbola Amigo Secreto
          </h1>
          <p className="text-gray-600">
            Organiza el sorteo perfecto para tu equipo
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Participantes
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalParticipantes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Emails</p>
                <p className="text-2xl font-bold text-purple-900">
                  {totalParticipantes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>ℹ️ Cómo funciona:</strong> Al iniciar la tómbola, cada
            participante recibirá un correo electrónico personalizado con el
            nombre de su amigo secreto. Las asignaciones son completamente
            privadas y nadie más podrá verlas.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Error al procesar la tómbola
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {resultados && resultados.fallidos > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800 mb-2">
                  Envío parcial completado
                </p>
                <p className="text-sm text-orange-700 mb-2">
                  Se enviaron {resultados.exitosos} de {resultados.total}{" "}
                  correos correctamente.
                </p>
                {resultados.detalles?.fallidos?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-orange-800 mb-1">
                      Correos fallidos:
                    </p>
                    <ul className="text-xs text-orange-700 space-y-1">
                      {resultados.detalles.fallidos.map((f: any, i: number) => (
                        <li key={i}>
                          • {f.to} - {f.error || "Error desconocido"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón de acción */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={iniciarTombola}
              disabled={loading || totalParticipantes < 2}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando correos...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Iniciar Tómbola
                </span>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">
                ¡Tómbola completada!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                {resultados && resultados.fallidos > 0 ? (
                  <>
                    Se enviaron {resultados.exitosos} de {resultados.total}{" "}
                    correos exitosamente. Revisa los detalles arriba para ver
                    los correos que fallaron.
                  </>
                ) : (
                  <>
                    Todas las asignaciones fueron enviadas exitosamente por
                    correo electrónico. Cada participante ya conoce a su amigo
                    secreto. ¡Que comience la magia! 🎉
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Ecotrans Chile • Amigo Secreto 2025
        </p>
      </div>
    </div>
  );
}
