import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id_info: string }> },
) {
  try {
    const { id_info } = await context.params;

    const { data } = await axios.patch(
      `${API_URL}/${id_info}/reset-password`,
    );

    return NextResponse.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json(
        { error: "Error al resetear contraseña" },
        { status: err.response.status },
      );
    }

    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 500 },
    );
  }
}