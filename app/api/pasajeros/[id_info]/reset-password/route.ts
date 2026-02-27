import axios from "axios";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros";

export async function PATCH(
  request: Request,
  { params }: { params: { id_info: string } },
) {
  try {
    const { data } = await axios.patch(
      `${API_URL}/${params.id_info}/reset-password`,
    );
    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return Response.json(
        { error: "Error al resetear contraseña" },
        { status: err.response.status },
      );
    }
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}
