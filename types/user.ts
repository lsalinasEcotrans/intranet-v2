export type UserStatus = "activo" | "inactivo" | "pendiente";

export interface User {
  id: string;
  correo: string;
  nombre: string;
  displayName: string;
  accountCode: string;
  customerId: string;
  estado: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDTO {
  correo: string;
  nombre: string;
  displayName: string;
  accountCode: string;
  customerId: string;
  estado?: UserStatus;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
