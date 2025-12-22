import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/* =========================================================================
   🔧 VARIABLES DE ENTORNO NECESARIAS PARA MICROSOFT GRAPH
   ========================================================================= */
const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const userEmail = process.env.USER_EMAIL!;

if (!tenantId || !clientId || !clientSecret || !userEmail) {
  console.warn("⚠️ Faltan variables de entorno para Graph API");
}

/* =========================================================================
   🔐 FUNCIÓN: Obtener token OAuth2 con client_credentials (Axios)
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
   📬 FUNCIÓN: Obtener mensaje por ID
   ========================================================================= */
async function getMessageById(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`;

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw new Error(
      `Graph error ${err.response?.status} - ${JSON.stringify(
        err.response?.data
      )}`
    );
  }
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

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.data.value || [];
  } catch (err: any) {
    throw new Error(
      `Error buscando conversación ${err.response?.status} - ${JSON.stringify(
        err.response?.data
      )}`
    );
  }
}

/* =========================================================================
   📎 FUNCIÓN: Adjuntos
   ========================================================================= */
async function getAttachments(accessToken: string, messageId: string) {
  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/attachments`;

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.data.value || [];
  } catch (err: any) {
    throw new Error(
      `Error obteniendo adjuntos: ${JSON.stringify(err.response?.data)}`
    );
  }
}

/* =========================================================================
   🖼 Insertar imágenes inline (cid:)
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
   📥 POST: Obtener correo o conversación
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

    // 1️⃣ Buscar por conversationId
    if (conversationId) {
      const mensajes = await getMessagesByConversation(token, conversationId);
      return NextResponse.json({ conversationId, mensajes });
    }

    // 2️⃣ Buscar mensaje específico + adjuntos
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

    // Incrustar imágenes inline
    message.body.content = embedInlineImages(
      message.body.content || "",
      attachments
    );

    // Formatear adjuntos descargables
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
   📤 PUT: Crear reply y enviarlo (Axios)
   ========================================================================= */
export async function PUT(req: NextRequest) {
  try {
    const { messageId, replyBody } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: "Falta messageId" }, { status: 400 });
    }

    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    // 1️⃣ Crear borrador
    const draftRes = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}/createReply`,
      {},
      { headers }
    );

    const draft = draftRes.data;

    // 2️⃣ Obtener borrador completo
    const draftFull = await axios
      .get(
        `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}`,
        { headers }
      )
      .then((r) => r.data);

    const originalHtml = draftFull.body?.content || "";

    // 3️⃣ Combinar HTML nuevo + historial
    const finalHtml = `
      <div>${replyBody}</div>
      ${originalHtml}
    `;

    // 4️⃣ PATCH: actualizar borrador
    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}`,
      {
        body: { contentType: "HTML", content: finalHtml },
      },
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );

    // 5️⃣ Enviar email
    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${draft.id}/send`,
      {},
      { headers }
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
