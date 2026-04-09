import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ auth_id: string }> },
) {
  try {
    const { auth_id } = await context.params;

    const { data } = await axios.patch(`${API_URL}/${auth_id}/reset-password`);

    return NextResponse.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json(
        { error: "Error al resetear contraseña" },
        { status: err.response.status },
      );
    }

    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}
