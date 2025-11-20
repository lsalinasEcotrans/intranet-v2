"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  username: string;
  full_name: string;
  role_id?: number;
  role_name?: string;
  extra_permissions?: any;
  created_at?: string;
}

interface Role {
  id: number;
  name: string;
}

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    role_id: 0,
  });

  const [creating, setCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 🔹 Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          "https://ecotrans-intranet-370980788525.europe-west1.run.app/usuarios"
        );
        setUsers(response.data);
      } catch (err) {
        console.error("❌ Error al cargar usuarios:", err);
        setError("No se pudieron cargar los usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 🔹 Cargar roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(
          "https://ecotrans-intranet-370980788525.europe-west1.run.app/roles/list"
        );
        setRoles(response.data);
      } catch (err) {
        console.error("❌ Error al cargar roles:", err);
      }
    };

    fetchRoles();
  }, []);

  // 🔹 Filtrar usuarios
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔹 Agregar usuario
  const handleAddUser = async () => {
    if (!formData.username || !formData.full_name || !formData.role_id) {
      alert("Completa todos los campos");
      return;
    }

    setCreating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        username: formData.username,
        full_name: formData.full_name,
        role_id: formData.role_id,
        extra_permissions: null,
      };

      await axios.post(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/usuarios",
        payload
      );

      setUsers([
        ...users,
        {
          ...payload,
          id: users.length + 1,
          role_name: roles.find((r) => r.id === formData.role_id)?.name,
        },
      ]);

      setFormData({ username: "", full_name: "", role_id: 0 });
      setIsOpen(false);
      setSuccessMessage("Usuario agregado correctamente ✅");

      // Desaparece el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error creando usuario:", err);
      setErrorMessage("No se pudo agregar el usuario ❌");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Buscador y botón */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por username, nombre o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Diálogo agregar usuario */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="ej: jdoe"
                />
              </div>

              <div>
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="ej: John Doe"
                />
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={
                    formData.role_id ? formData.role_id.toString() : undefined
                  }
                  onValueChange={(value) =>
                    setFormData({ ...formData, role_id: Number(value) })
                  }
                >
                  <SelectTrigger id="role" className="w-[200px]">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {creating && (
                  <div className="text-sm text-blue-600">
                    Agregando usuario...
                  </div>
                )}
                {successMessage && (
                  <div className="text-sm text-green-600">{successMessage}</div>
                )}
                {errorMessage && (
                  <div className="text-sm text-red-600">{errorMessage}</div>
                )}
              </div>

              <Button
                onClick={handleAddUser}
                className="w-full"
                disabled={creating}
              >
                Crear Usuario
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            Cargando usuarios...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre completo</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.full_name || "-"}</TableCell>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role_name || "Sin rol"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("es-CL")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
