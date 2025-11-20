// Enlace externo
interface EnvConfig {
  NEXT_PUBLIC_API_PROTOCOL: string | undefined;
  NEXT_PUBLIC_API_ENDPOINT_PROD: string | undefined;
  NEXT_PUBLIC_API_PORT: string | undefined;
  NEXT_PUBLIC_API_INTRANET: string | undefined;
}

// Cargamos las variables del entorno
const env: EnvConfig = {
  NEXT_PUBLIC_API_PROTOCOL: process.env.NEXT_PUBLIC_API_PROTOCOL,
  NEXT_PUBLIC_API_ENDPOINT_PROD: process.env.NEXT_PUBLIC_API_ENDPOINT_PROD,
  NEXT_PUBLIC_API_PORT: process.env.NEXT_PUBLIC_API_PORT,
  NEXT_PUBLIC_API_INTRANET: process.env.NEXT_PUBLIC_API_INTRANET,
};

// Construimos la URL base de la API externa
const URL_API_Externa = `${env.NEXT_PUBLIC_API_PROTOCOL}://${env.NEXT_PUBLIC_API_ENDPOINT_PROD}:${env.NEXT_PUBLIC_API_PORT}`;

// URL interna (tu API FastAPI en Cloud Run)
const URL_API_Intranet = `${env.NEXT_PUBLIC_API_INTRANET}`;

export const API_ENDPOINTS = {
  externa: {
    authenticate: `${URL_API_Externa}/api/v1/authenticate`,
  },
  intranet: {
    roles: `${URL_API_Intranet}/roles`,
  },
};
