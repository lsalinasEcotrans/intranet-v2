import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function POST(req: NextRequest) {
  try {
    const { action, folder, messageId } = await req.json();

    const { TENANT_ID, CLIENT_ID, CLIENT_SECRET, USER_EMAIL } = process.env;

    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !USER_EMAIL) {
      return NextResponse.json(
        { error: "Missing environment variables" },
        { status: 500 }
      );
    }

    // ================= TOKEN =================
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    const graph = axios.create({
      baseURL: GRAPH_BASE,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // ================= USER INFO =================
    if (action === "getUserInfo") {
      const res = await graph.get(`/users/${USER_EMAIL}`);
      return NextResponse.json(res.data);
    }

    // ================= MESSAGES =================
    if (action === "getMessages") {
      const res = await graph.get(
        `/users/${USER_EMAIL}/mailFolders/${folder}/messages`,
        {
          params: {
            $top: 25,
            $select: "id,subject,bodyPreview,from,receivedDateTime,isRead",
            $orderby: "receivedDateTime DESC",
          },
        }
      );

      return NextResponse.json(res.data);
    }

    // ================= SINGLE MESSAGE =================
    if (action === "getMessage") {
      if (!messageId) {
        return NextResponse.json(
          { error: "messageId required" },
          { status: 400 }
        );
      }

      const res = await graph.get(
        `/users/${USER_EMAIL}/messages/${messageId}`,
        {
          params: {
            $select: "subject,from,receivedDateTime,body",
          },
        }
      );

      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Graph API Error", err.response?.data || err.message);

    return NextResponse.json(
      {
        error: "Graph request failed",
        details: err.response?.data || err.message,
      },
      { status: 500 }
    );
  }
}
