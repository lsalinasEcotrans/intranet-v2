// Api->autocomplete->details->route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const DETAILS_URL =
  "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/ghost/v2/autocomplete/details";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const placeID = request.nextUrl.searchParams.get("placeID");

    const { data } = await axios.get(DETAILS_URL, {
      params: { placeID },
      headers: {
        "Content-Type": "application/json",
        "Authentication-Token": `Bearer ${token}`,
      },
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error details:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
