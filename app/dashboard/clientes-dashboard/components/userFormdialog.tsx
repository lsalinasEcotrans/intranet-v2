"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, X, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserFormDialog({
  user,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    displayName: "",
    accountCode: "",
    customerId: "",
    estado: "activo",
  });

  // ✅ 1. Debounce para controlar las peticiones
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ✅ 2. Query de búsqueda (Sincronizada con debouncedSearchTerm)
  const {
    data: results,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["ghost-search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];
      const { data } = await axios.get(
        `/api/ghost/customers/search?q=${encodeURIComponent(debouncedSearchTerm)}`,
      );
      return data;
    },
    enabled: isOpen && debouncedSearchTerm.length > 0,
  });

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resetear formulario al abrir/cerrar o cambiar usuario
  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        nombre: "",
        correo: "",
        displayName: "",
        accountCode: "",
        customerId: "",
        estado: "activo",
      });
    }
    setSearchTerm("");
    setErrors({});
  }, [user, isOpen]);

  const handleSelect = (customer: any) => {
    setFormData({
      ...formData,
      displayName: customer.displayName,
      accountCode: customer.accountCode,
      customerId: customer.id.toString(),
    });
    setSearchTerm("");
    setShowResults(false);
  };

  const handleClearCustomer = () => {
    setFormData({
      ...formData,
      displayName: "",
      accountCode: "",
      customerId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación simple
    if (!formData.customerId) {
      setErrors({ customerId: "Debes seleccionar un cliente" });
      return;
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <DialogTitle>
            {user ? "✏️ Editar Usuario" : "👤 Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            Busca y vincula un cliente de Ghost para este usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* BUSCADOR PERSONALIZADO */}
          <div className="flex flex-col gap-2 relative" ref={containerRef}>
            <label className="text-sm font-semibold text-gray-700">
              Cliente (Ghost) *
            </label>

            {!formData.customerId ? (
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Busca por nombre o ID (ej: Banco o 171)..."
                  value={searchTerm}
                  onFocus={() => setShowResults(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowResults(true);
                  }}
                  className="pl-10 h-11 border-gray-300 focus:ring-[#6C9E3C]"
                />

                {/* LISTA DE RESULTADOS */}
                {showResults && searchTerm.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-60 overflow-auto border-gray-200">
                    {isFetching ? (
                      <div className="p-4 flex items-center justify-center text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                        Buscando...
                      </div>
                    ) : results?.length > 0 ? (
                      results.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelect(c)}
                          className="p-3 hover:bg-green-50 cursor-pointer border-b last:border-0 flex flex-col transition-colors"
                        >
                          <span className="text-sm font-bold text-gray-800">
                            {c.displayName}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            Código: {c.accountCode}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No hay resultados.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* CARD DE SELECCIÓN */
              <div className="flex items-center justify-between bg-green-50 border border-[#6C9E3C] rounded-md p-3 transition-all">
                <div className="flex items-center gap-3">
                  <div className="bg-[#6C9E3C] p-1.5 rounded-full">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {formData.displayName}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      Código Ghost: {formData.accountCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearCustomer}
                  className="hover:bg-red-50"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            )}
            {errors.customerId && (
              <span className="text-xs text-red-500 font-medium">
                {errors.customerId}
              </span>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* RESTO DEL FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Nombre de Usuario
              </label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="ej: juan.perez"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Email Corporativo
              </label>
              <Input
                type="email"
                value={formData.correo}
                onChange={(e) =>
                  setFormData({ ...formData, correo: e.target.value })
                }
                placeholder="correo@empresa.com"
                className="h-10"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#6C9E3C] hover:bg-[#5a8532] text-white px-8"
                disabled={isLoading || !formData.customerId}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user ? (
                  "Actualizar"
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
