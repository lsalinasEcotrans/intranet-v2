// services/dashboard-cliente.ts
import axios from "axios";
import { User, CreateUserDTO, UpdateUserDTO } from "@/types/user";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://ecotrans-intranet-370980788525.europe-west1.run.app",
});

export const userActions = {
  getAll: () => api.get<User[]>("/auth-login/").then((res) => res.data),
  getById: (id: string) =>
    api.get<User>(`/auth-login/${id}`).then((res) => res.data),
  create: (data: CreateUserDTO) => api.post("/auth-login/", data),
  update: (id: string, data: UpdateUserDTO) =>
    api.put(`/auth-login/${id}`, data),
  delete: (id: string) => api.delete(`/auth-login/${id}`),
  resetPassword: (id: string) => api.patch(`/auth-login/${id}/reset-password`),
};
