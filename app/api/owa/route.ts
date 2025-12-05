import { NextRequest, NextResponse } from "next/server";

/* =========================================================================
   🔧 VARIABLES DE ENTORNO NECESARIAS PARA MICROSOFT GRAPH
   ========================================================================= */
const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const userEmail = process.env.USER_EMAIL!; // buzón desde donde se leen correos

if (!tenantId || !clientId || !clientSecret || !userEmail) {
  console.warn("⚠️ Faltan variables de entorno para Graph API");
}

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

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token request failed ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return data.access_token;
}

/* =========================================================================
   📬 FUNCIÓN: Obtener un mensaje por su ID
   ========================================================================= */
async function getMessageById(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Graph error ${res.status} - ${txt}`);
  }

  return await res.json();
}

/* =========================================================================
   💬 FUNCIÓN: Obtener mensajes por conversationId
   ========================================================================= */
async function getMessagesByConversation(
  accessToken: string,
  conversationId: string
) {
  const url =
    `https://graph.microsoft.com/v1.0/users/${userEmail}/messages` +
    `?$filter=conversationId eq '${conversationId}'` +
    `&$orderby=sentDateTime asc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error buscando conversación ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return data.value || [];
}

/* =========================================================================
   📎 FUNCIÓN: Obtener adjuntos del mensaje
   ========================================================================= */
async function getAttachments(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/attachments`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error obteniendo adjuntos: ${txt}`);
  }

  const data = await res.json();
  return data.value || [];
}

/* =========================================================================
   🖼 FUNCIÓN: Insertar imágenes inline (cid:) dentro del HTML
   ========================================================================= */
function embedInlineImages(bodyHtml: string, attachments: any[]) {
  let updated = bodyHtml;

  for (const att of attachments) {
    if (att.isInline && att.contentId && att.contentBytes) {
      const cid = att.contentId.replace(/[<>]/g, "");
      const dataUrl = `data:${att.contentType};base64,${att.contentBytes}`;
      updated = updated.replaceAll(`cid:${cid}`, dataUrl);
    }
  }

  return updated;
}

/* =========================================================================
   📥 POST: Obtiene correo por ID o por conversationId
   ========================================================================= */
export async function POST(req: NextRequest) {
  try {
    const { messageId, conversationId } = await req.json();

    if (!messageId && !conversationId) {
      return NextResponse.json(
        { error: "Debes enviar messageId o conversationId" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    /* -----------------------------------------------------------
       🔍 1️⃣ Si enviaron conversationId → devolver todos los correos
       ----------------------------------------------------------- */
    if (conversationId) {
      const mensajes = await getMessagesByConversation(token, conversationId);
      return NextResponse.json({ conversationId, mensajes });
    }

    /* -----------------------------------------------------------
       ✉️ 2️⃣ Si enviaron messageId → traer correo con adjuntos
       ----------------------------------------------------------- */
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

    // Embeder imágenes inline
    message.body.content = embedInlineImages(
      message.body.content || "",
      attachments
    );

    // Adjuntos descargables
    message.attachments = attachments
      .filter((a: any) => !a.isInline && a.contentBytes)
      .map((a: any) => ({
        name: a.name,
        contentType: a.contentType,
        size: a.size,
        dataUrl: `data:${a.contentType};base64,${a.contentBytes}`,
      }));

    return NextResponse.json(message);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}

/* =========================================================================
   📤 PUT: Crear reply, rellenar HTML y enviarlo
   ========================================================================= */
export async function PUT(req: NextRequest) {
  try {
    const { messageId, replyBody } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: "Falta messageId" }, { status: 400 });
    }

    const token = await getAccessToken();

    // 1️⃣ Crear borrador de respuesta
    const draftRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/createReply`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!draftRes.ok) throw new Error(await draftRes.text());
    const draft = await draftRes.json();

    // 2️⃣ Obtener el borrador completo (contiene el email original)
    const draftFull = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ).then((r) => r.json());

    const originalHtml = draftFull.body?.content || "";

    // 3️⃣ Combinar tu respuesta + historial del correo
    const finalHtml = `
      <div>${replyBody}</div>
      <br/><hr/>correodeecotrans
      ${originalHtml}
    `;

    // 4️⃣ Actualizar el borrador con el HTML final
    const patchRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: { contentType: "HTML", content: finalHtml },
        }),
      }
    );

    if (!patchRes.ok) {
      throw new Error(await patchRes.text());
    }

    // 5️⃣ Enviar el correo
    await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}/send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
