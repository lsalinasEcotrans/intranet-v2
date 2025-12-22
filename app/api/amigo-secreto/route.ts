import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

/* =========================================================================
   🔧 VARIABLES DE ENTORNO NECESARIAS PARA MICROSOFT GRAPH
   ========================================================================= */
const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const userEmail = process.env.USER_EMAIL!;

// 📧 Correo donde se enviará el log de asignaciones
const LOG_EMAIL = "lsalinas@ecotranschile.cl";

/* =========================================================================
   🔐 FUNCIÓN: Obtener token OAuth2 con client_credentials
   ========================================================================= */
async function getAccessToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const response = await axios.post(url, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data.access_token;
  } catch (err: any) {
    throw new Error(
      `Token request failed: ${err.response?.status} - ${err.response?.data}`
    );
  }
}

/* =========================================================================
   📝 FUNCIÓN: Guardar log de asignaciones
   ========================================================================= */
function guardarLogAsignaciones(emails: any[]) {
  try {
    const timestamp = new Date().toISOString();
    const logData = {
      fecha: timestamp,
      fechaLegible: new Date().toLocaleString("es-CL", {
        timeZone: "America/Santiago",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      totalAsignaciones: emails.length,
      asignaciones: emails.map((e) => ({
        quien: e.giverName,
        email: e.to,
        leToco: e.receiverName,
      })),
    };

    // Crear carpeta logs si no existe
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Guardar archivo con fecha en el nombre
    const fileName = `amigo-secreto-${
      new Date().toISOString().split("T")[0]
    }-${Date.now()}.json`;
    const filePath = path.join(logsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), "utf-8");

    console.log(`📋 Log guardado en: ${filePath}`);

    // También crear/actualizar un archivo de historial completo
    const historialPath = path.join(logsDir, "historial-completo.json");
    let historial = [];

    if (fs.existsSync(historialPath)) {
      const contenido = fs.readFileSync(historialPath, "utf-8");
      historial = JSON.parse(contenido);
    }

    historial.push(logData);
    fs.writeFileSync(
      historialPath,
      JSON.stringify(historial, null, 2),
      "utf-8"
    );

    return { filePath, fileName, logData };
  } catch (err) {
    console.error("❌ Error guardando log:", err);
    return null;
  }
}

/* =========================================================================
   📧 FUNCIÓN: Generar HTML del log para email
   ========================================================================= */
function generarEmailLog(logData: any, exitosos: number, fallidos: number) {
  const asignacionesHTML = logData.asignaciones
    .map(
      (a: any, i: number) => `
    <tr style="border-bottom: 1px solid #e9ecef;">
      <td style="padding: 12px 15px; text-align: center; color: #6c757d; font-size: 14px;">${
        i + 1
      }</td>
      <td style="padding: 12px 15px; color: #333; font-weight: 500; font-size: 14px;">${
        a.quien
      }</td>
      <td style="padding: 12px 15px; text-align: center; color: #667eea; font-size: 20px;">→</td>
      <td style="padding: 12px 15px; color: #333; font-weight: 500; font-size: 14px;">${
        a.leToco
      }</td>
      <td style="padding: 12px 15px; color: #6c757d; font-size: 13px;">${
        a.email
      }</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log Amigo Secreto 2025</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                📋 Log de Asignaciones - Amigo Secreto 2025
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                ${logData.fechaLegible}
              </p>
            </td>
          </tr>
          
          <!-- Resumen -->
          <tr>
            <td style="padding: 30px;">
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center; padding: 10px;">
                      <p style="color: #ffffff; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total Asignaciones</p>
                      <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">${logData.totalAsignaciones}</p>
                    </td>
                    <td style="text-align: center; padding: 10px; border-left: 2px solid rgba(255,255,255,0.3);">
                      <p style="color: #ffffff; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Enviados</p>
                      <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">${exitosos}</p>
                    </td>
                    <td style="text-align: center; padding: 10px; border-left: 2px solid rgba(255,255,255,0.3);">
                      <p style="color: #ffffff; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Fallidos</p>
                      <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">${fallidos}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Tabla de asignaciones -->
              <h2 style="color: #333; font-size: 20px; margin: 0 0 20px 0;">Detalle de Asignaciones</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 15px; text-align: center; color: #495057; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">#</th>
                    <th style="padding: 15px; text-align: left; color: #495057; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Quien da</th>
                    <th style="padding: 15px; text-align: center; color: #495057; font-size: 13px; font-weight: 600;"></th>
                    <th style="padding: 15px; text-align: left; color: #495057; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Le toca</th>
                    <th style="padding: 15px; text-align: left; color: #495057; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email</th>
                  </tr>
                </thead>
                <tbody>
                  ${asignacionesHTML}
                </tbody>
              </table>
              
              <!-- Nota de confidencialidad -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
                <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.6;">
                  <strong>⚠️ Confidencial:</strong> Este correo contiene información sensible sobre las asignaciones del Amigo Secreto. 
                  Por favor, no compartir esta información con ningún participante para mantener la sorpresa.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">
                <strong>Ecotrans Chile</strong> | Sistema de Amigo Secreto 2025<br>
                Log generado automáticamente el ${logData.fechaLegible}
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

/* =========================================================================
   📤 FUNCIÓN: Enviar log por correo
   ========================================================================= */
async function enviarLogPorCorreo(
  token: string,
  logData: any,
  exitosos: number,
  fallidos: number,
  fileName: string
) {
  try {
    const htmlContent = generarEmailLog(logData, exitosos, fallidos);

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`,
      {
        message: {
          subject: `📋 Log Amigo Secreto 2025 - ${logData.fechaLegible}`,
          body: {
            contentType: "HTML",
            content: htmlContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: LOG_EMAIL,
              },
            },
          ],
          importance: "high",
        },
        saveToSentItems: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Log enviado por correo a: ${LOG_EMAIL}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Error enviando log por correo:`, err.response?.data);
    return false;
  }
}

/* =========================================================================
   🎁 POST: Enviar correos masivos de Amigo Secreto
   ========================================================================= */
export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar un array de emails" },
        { status: 400 }
      );
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `🎁 TÓMBOLA AMIGO SECRETO - ${new Date().toLocaleString("es-CL")}`
    );
    console.log(`${"=".repeat(60)}`);
    console.log(`📧 Iniciando envío de ${emails.length} correos...\n`);

    // 📝 GUARDAR LOG DE ASIGNACIONES ANTES DE ENVIAR
    const logInfo = guardarLogAsignaciones(emails);
    if (logInfo) {
      console.log(`✅ Log guardado: ${logInfo.fileName}\n`);
    }

    // Mostrar asignaciones en consola
    console.log("📋 ASIGNACIONES:");
    emails.forEach((e: any, i: number) => {
      console.log(`   ${i + 1}. ${e.giverName} 👉 ${e.receiverName}`);
    });
    console.log("");

    const token = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Enviar todos los correos en paralelo
    const resultados = await Promise.allSettled(
      emails.map(async (email: any, index: number) => {
        const { to, subject, html, giverName, receiverName } = email;

        try {
          await axios.post(
            `https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`,
            {
              message: {
                subject: subject,
                body: {
                  contentType: "HTML",
                  content: html,
                },
                toRecipients: [
                  {
                    emailAddress: {
                      address: to,
                    },
                  },
                ],
              },
              saveToSentItems: true,
            },
            { headers }
          );

          console.log(
            `✅ [${index + 1}/${emails.length}] Enviado a: ${giverName} (${to})`
          );

          return {
            success: true,
            to,
            giverName,
            receiverName,
          };
        } catch (err: any) {
          console.error(
            `❌ [${index + 1}/${
              emails.length
            }] Error enviando a ${giverName} (${to}):`,
            err.response?.data
          );
          return {
            success: false,
            to,
            giverName,
            error: err.response?.data?.error?.message || err.message,
          };
        }
      })
    );

    // Analizar resultados
    const exitosos = resultados.filter(
      (r) => r.status === "fulfilled" && r.value.success
    );
    const fallidos = resultados.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success)
    );

    // 📧 ENVIAR LOG POR CORREO
    if (logInfo) {
      console.log(`\n📧 Enviando log por correo a ${LOG_EMAIL}...`);
      await enviarLogPorCorreo(
        token,
        logInfo.logData,
        exitosos.length,
        fallidos.length,
        logInfo.fileName
      );
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 RESUMEN FINAL`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Exitosos: ${exitosos.length}`);
    console.log(`❌ Fallidos: ${fallidos.length}`);
    console.log(`📧 Total: ${emails.length}`);
    if (logInfo) {
      console.log(`📁 Log guardado en: logs/${logInfo.fileName}`);
      console.log(`📧 Log enviado a: ${LOG_EMAIL}`);
    }
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json({
      success: fallidos.length === 0,
      total: emails.length,
      exitosos: exitosos.length,
      fallidos: fallidos.length,
      logFile: logInfo?.fileName || null,
      logEmailSent: true,
      detalles: {
        exitosos: exitosos.map((r: any) => r.value),
        fallidos: fallidos.map((r: any) =>
          r.status === "rejected" ? r.reason : r.value
        ),
      },
    });
  } catch (err: any) {
    console.error("💥 Error en envío masivo:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
