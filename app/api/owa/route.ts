import { NextRequest, NextResponse } from "next/server";

const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const userEmail = process.env.USER_EMAIL!; // buzón que se leerá

if (!tenantId || !clientId || !clientSecret || !userEmail) {
  console.warn("⚠️ Faltan variables de entorno para Graph API");
}

// -------------------------
// Funciones auxiliares
// -------------------------

async function getAccessToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed ${res.status} - ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in token response");

  return data.access_token;
}

async function getMessageById(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    userEmail
  )}/messages/${encodeURIComponent(messageId)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status} - ${text}`);
  }

  return await res.json();
}

// 🔹 Obtener los adjuntos (imágenes inline o archivos)
async function getAttachments(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
    userEmail
  )}/messages/${encodeURIComponent(messageId)}/attachments`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error obteniendo adjuntos: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.value || [];
}

// 🔹 Reemplazar imágenes cid: por base64 embebido
function embedInlineImages(bodyHtml: string, attachments: any[]) {
  let updatedBody = bodyHtml;

  for (const att of attachments) {
    if (att.isInline && att.contentId && att.contentBytes) {
      const cid = att.contentId.replace(/[<>]/g, "");
      const dataUrl = `data:${att.contentType};base64,${att.contentBytes}`;
      updatedBody = updatedBody.replaceAll(`cid:${cid}`, dataUrl);
    }
  }

  return updatedBody;
}

// -------------------------
// Métodos API
// -------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageId = body?.messageId;

    if (!messageId) {
      return NextResponse.json(
        { error: "Falta messageId en body" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    const [message, attachments] = await Promise.all([
      getMessageById(token, messageId),
      getAttachments(token, messageId),
    ]);

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }

    // 🔄 Embebe las imágenes inline en el cuerpo HTML
    const html = message.body?.content || "";
    message.body.content = embedInlineImages(html, attachments);

    // 🔽 Agrega los archivos adjuntos descargables (no inline)
    const fileAttachments = attachments
      .filter((att: any) => !att.isInline && att.contentBytes)
      .map((att: any) => ({
        name: att.name,
        contentType: att.contentType,
        size: att.size,
        dataUrl: `data:${att.contentType};base64,${att.contentBytes}`,
      }));

    message.attachments = fileAttachments;

    return NextResponse.json(message);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
