import { useState, useEffect, useMemo } from "react";
import axios from "axios";

interface Correo {
  id: number;
  fecha: string;
  asunto: string;
  estado: string;
  asignado: string | null;
  idCorreo: number;
  intencion: string;
}

interface CorreoNormalizado extends Correo {
  estadoNormalizado: string;
  fechaTimestamp: number;
  esMio: boolean;
}

const normalizeEstado = (estado: string): string => {
  if (estado === "1" || estado === "Pendiente") return "Pendiente";
  if (estado === "2" || estado === "Completado") return "Completado";
  if (estado === "3" || estado === "En proceso") return "En proceso";
  if (estado === "4" || estado === "Respondido X Cliente")
    return "Respuesta de cliente";
  if (estado === "5" || estado === "Espera respuesta")
    return "Espera de respuesta";
  return estado;
};

export function useCorreos(userName: string | undefined) {
  const [correos, setCorreos] = useState<Correo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorreos = () => {
      axios
        .get(
          "https://ecotrans-intranet-370980788525.europe-west1.run.app/headers"
        )
        .then((res) => {
          setCorreos((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(res.data)) {
              return res.data;
            }
            return prev;
          });
        })
        .catch((err) => console.error("Error cargando correos:", err))
        .finally(() => setLoading(false));
    };

    setLoading(true);
    fetchCorreos();

    const interval = setInterval(fetchCorreos, 7000);
    return () => clearInterval(interval);
  }, []);

  const correosNormalizados = useMemo<CorreoNormalizado[]>(() => {
    return correos.map((correo) => ({
      ...correo,
      estadoNormalizado: normalizeEstado(correo.estado),
      fechaTimestamp: new Date(correo.fecha).getTime(),
      esMio: correo.asignado === userName,
    }));
  }, [correos, userName]);

  return { correos, setCorreos, correosNormalizados, loading, setLoading };
}
