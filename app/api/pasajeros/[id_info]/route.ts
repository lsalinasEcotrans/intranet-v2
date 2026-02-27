import axios from "axios";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros";

export async function GET(
  request: Request,
  { params }: { params: { id_info: string } },
) {
  try {
    const { data } = await axios.get(`${API_URL}/auth/${params.id_info}`);
    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return Response.json(
        { error: "Pasajero no encontrado" },
        { status: err.response.status },
      );
    }
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id_info: string } },
) {
  try {
    const body = await request.json();
    const { data } = await axios.put(`${API_URL}/${params.id_info}`, body);
    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return Response.json(
        { error: "Error al actualizar pasajero" },
        { status: err.response.status },
      );
    }
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id_info: string } },
) {
  try {
    const { data } = await axios.delete(`${API_URL}/${params.id_info}`);
    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return Response.json(
        { error: "Error al eliminar pasajero" },
        { status: err.response.status },
      );
    }
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}
