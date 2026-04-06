import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auth_id: string }> },
) {
  try {
    const { auth_id } = await context.params;

    const { data } = await axios.get(`${API_URL}/auth/${auth_id}`);

    return NextResponse.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json(
        { error: "Pasajero no encontrado" },
        { status: err.response.status },
      );
    }

    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ auth_id: string }> },
) {
  try {
    const { auth_id } = await context.params;
    const body = await request.json();

    const { data } = await axios.put(`${API_URL}/${auth_id}`, body);

    return NextResponse.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json(
        { error: "Error al actualizar pasajero" },
        { status: err.response.status },
      );
    }

    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ auth_id: string }> },
) {
  try {
    const { auth_id } = await context.params;

    const { data } = await axios.delete(`${API_URL}/${auth_id}`);

    return NextResponse.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json(
        { error: "Error al eliminar pasajero" },
        { status: err.response.status },
      );
    }

    return NextResponse.json({ error: "Error de conexión" }, { status: 500 });
  }
}
