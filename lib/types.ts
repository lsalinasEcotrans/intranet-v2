export interface Pasajero {
  id_info: number;
  auth_id: number;
  grupo_numero: number;
  rut: string;
  nombre: string;
  contacto: string;
  rol: string;
  turno: string;
  direccion_origen: string;
  centro_costo: string;
  latitud_origen: number | null;
  longitud_origen: number | null;
  hora_programada: number;
  direccion_destino: string;
  latitud_destino: number | null;
  longitud_destino: number | null;
  created_at: string;
  updated_at: string;
}
