import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const AUTOCOMPLETE_URL =
  "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/ghost/v2/autocomplete";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const text = request.nextUrl.searchParams.get("text") || "";
    const companyID = request.nextUrl.searchParams.get("companyID") || "1";

    const { data } = await axios.get(AUTOCOMPLETE_URL, {
      params: { companyID, text },
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": `Bearer ${token}`,
      },
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error autocomplete:", err?.response?.data || err);

    return NextResponse.json(
      { error: "Error interno", backend: err?.response?.data },
      { status: 500 }
    );
  }
}
