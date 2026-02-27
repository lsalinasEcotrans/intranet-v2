import axios from "axios";

const API_URL =
  "https://ecotrans-pasajero-370980788525.europe-west1.run.app/pasajeros/";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turno = searchParams.get("turno");

    const url = turno ? `${API_URL}?turno=${turno}` : API_URL;

    const { data } = await axios.get(url);

    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return Response.json(
        { error: "Error al obtener pasajeros" },
        { status: err.response.status },
      );
    }
    return Response.json(
      { error: "Error de conexion con el servidor" },
      { status: 500 },
    );
  }
}
