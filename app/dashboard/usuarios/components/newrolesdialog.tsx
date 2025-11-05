"use client";

import { useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  title: string;
  url: string;
  icon?: string;
  items?: MenuItem[];
}

interface NewRoleDialogProps {
  onRoleCreated?: () => void; // ✅ callback opcional para refrescar la tabla
}

const menuItems: MenuItem[] = [
  {
    title: "Operaciones",
    url: "#",
    icon: "Handshake",
    items: [
      { title: "Contratos", url: "#" },
      { title: "Documentos", url: "#" },
      { title: "Flota", url: "#" },
      { title: "Revisiones", url: "#" },
      { title: "Seguros", url: "#" },
    ],
  },
  {
    title: "Contabilidad",
    url: "#",
    icon: "HandCoins",
    items: [{ title: "General1", url: "#" }],
  },
  {
    title: "Facturacion",
    url: "#",
    icon: "FileCheck",
    items: [{ title: "General2", url: "#" }],
  },
  {
    title: "Cargas Masivas",
    url: "#",
    icon: "Database",
    items: [
      { title: "Banco de Chile", url: "#" },
      { title: "Hualpen", url: "#" },
    ],
  },
  {
    title: "Locucion",
    url: "#",
    icon: "Headset",
    items: [
      { title: "Codigo Activacion", url: "#" },
      { title: "Correos", url: "/dashboard/correos" },
      { title: "EcotransGO", url: "#" },
      { title: "Hualpen", url: "#" },
      { title: "Libro Novedades", url: "#" },
      { title: "Servicios Pendientes", url: "#" },
      { title: "Suspendidos", url: "#" },
      { title: "Turnos", url: "#" },
      { title: "Turnos Moviles", url: "#" },
    ],
  },
  {
    title: "Reportes",
    url: "#",
    icon: "FileChartPieIcon",
    items: [{ title: "General3", url: "#" }],
  },
  {
    title: "Taller",
    url: "#",
    icon: "Wrench",
    items: [
      { title: "OTs", url: "#" },
      { title: "Presupuestos", url: "#" },
    ],
  },
  {
    title: "Sistemas",
    url: "#",
    icon: "MonitorCog",
    items: [{ title: "Usuarios", url: "/dashboard/usuarios" }],
  },
  {
    title: "Pruebas",
    url: "#",
    icon: "FlaskConical",
    items: [{ title: "Test", url: "/dashboard/test" }],
  },
];

export function NewRoleDialog({ onRoleCreated }: NewRoleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Lista de todos los permisos (padres + hijos)
  const allPermissions = useMemo(
    () =>
      menuItems.flatMap((p) => [
        p.title,
        ...(p.items?.map((i) => i.title) || []),
      ]),
    []
  );

  // Mapa padre → hijos y viceversa
  const parentChildMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const childParentMap = new Map<string, string>();

    menuItems.forEach((item) => {
      const children = item.items?.map((i) => i.title) || [];
      map.set(item.title, children);
      children.forEach((child) => childParentMap.set(child, item.title));
    });

    return { parentToChildren: map, childToParent: childParentMap };
  }, []);

  // Filtrado de menú según búsqueda
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;

    const term = searchTerm.toLowerCase();
    return menuItems
      .map((item) => {
        const matchesParent = item.title.toLowerCase().includes(term);
        const filteredChildren =
          item.items?.filter((child) =>
            child.title.toLowerCase().includes(term)
          ) || [];

        if (matchesParent || filteredChildren.length > 0) {
          return {
            ...item,
            items: matchesParent ? item.items : filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as MenuItem[];
  }, [searchTerm]);

  // Expandir automáticamente cuando se busca
  useMemo(() => {
    if (searchTerm.trim()) {
      const expanded = new Set<string>();
      filteredMenuItems.forEach((item) => {
        if (item.items?.length) expanded.add(item.title);
      });
      setExpandedItems(expanded);
    }
  }, [searchTerm, filteredMenuItems]);

  // Toggle expandir/cerrar
  const toggleExpanded = useCallback((title: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(title) ? newSet.delete(title) : newSet.add(title);
      return newSet;
    });
  }, []);

  // Manejo de selección de permisos
  const togglePermission = useCallback(
    (title: string, hasChildren: boolean) => {
      setSelectedPermissions((prev) => {
        const newSet = new Set(prev);

        if (hasChildren) {
          const children = parentChildMap.parentToChildren.get(title) || [];
          const isSelected = newSet.has(title);

          if (isSelected) {
            newSet.delete(title);
            children.forEach((child) => newSet.delete(child));
          } else {
            newSet.add(title);
            children.forEach((child) => newSet.add(child));
          }
        } else {
          const parent = parentChildMap.childToParent.get(title);
          if (newSet.has(title)) {
            newSet.delete(title);
            if (parent) newSet.delete(parent);
          } else {
            newSet.add(title);
            if (parent) {
              const siblings =
                parentChildMap.parentToChildren.get(parent) || [];
              const allSiblingsSelected = siblings.every((s) => newSet.has(s));
              if (allSiblingsSelected) newSet.add(parent);
            }
          }
        }

        return newSet;
      });
    },
    [parentChildMap]
  );

  // Seleccionar/deseleccionar todos
  const toggleAllPermissions = useCallback(() => {
    if (selectedPermissions.size === allPermissions.length) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allPermissions));
    }
  }, [selectedPermissions.size, allPermissions]);

  // Construcción del payload
  const buildPayload = useCallback(() => {
    const grouped: Record<string, Set<string>> = {};

    selectedPermissions.forEach((perm) => {
      const parent = parentChildMap.childToParent.get(perm);
      if (parent) {
        grouped[parent] = grouped[parent] || new Set();
        grouped[parent].add(perm);
      } else {
        grouped[perm] = grouped[perm] || new Set();
      }
    });

    const json_menu = Object.entries(grouped)
      .map(([parentTitle, childrenSet]) => {
        const parent = menuItems.find((m) => m.title === parentTitle);
        if (!parent) return null;

        const itemsToInclude =
          parent.items?.filter((i) => childrenSet.has(i.title)) || [];

        return {
          title: parent.title,
          url: parent.url,
          icon: parent.icon || null,
          items: itemsToInclude,
        };
      })
      .filter(
        (m) =>
          m !== null && (m.items.length > 0 || selectedPermissions.has(m.title))
      );

    return {
      name: roleName.trim(),
      json_menu,
    };
  }, [selectedPermissions, roleName, parentChildMap]);

  // Enviar al backend
  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error("Por favor ingresa un nombre para el rol");
      return;
    }

    if (selectedPermissions.size === 0) {
      toast.error("Por favor selecciona al menos un permiso");
      return;
    }

    const payload = buildPayload();
    setLoading(true);

    try {
      await axios.post(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/roles",
        payload
      );

      toast.success("Rol creado correctamente");
      onRoleCreated?.(); // ✅ refresca la tabla
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al crear el rol. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoleName("");
    setSelectedPermissions(new Set());
    setExpandedItems(new Set());
    setSearchTerm("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  // Renderizado recursivo del menú
  const renderMenuItems = (items: MenuItem[], level = 0) =>
    items.map((item) => {
      const hasChildren = !!item.items?.length;
      const isExpanded = expandedItems.has(item.title);
      const isSelected = selectedPermissions.has(item.title);
      const children = parentChildMap.parentToChildren.get(item.title) || [];
      const allChildrenSelected =
        children.length > 0 &&
        children.every((c) => selectedPermissions.has(c));
      const someChildrenSelected = children.some((c) =>
        selectedPermissions.has(c)
      );

      return (
        <div key={item.title} className="select-none">
          <div
            className={`flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent/50 transition-colors ${
              level > 0 ? "ml-6" : ""
            }`}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(item.title)}
                className="hover:bg-accent rounded p-1 transition-colors flex-shrink-0"
                aria-label={isExpanded ? "Contraer" : "Expandir"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <Checkbox
              checked={isSelected || allChildrenSelected}
              ref={(el) => {
                if (el && someChildrenSelected && !allChildrenSelected) {
                  el.setAttribute("data-state", "indeterminate");
                }
              }}
              onCheckedChange={() => togglePermission(item.title, hasChildren)}
              id={`perm-${item.title}`}
              className="flex-shrink-0"
            />

            <Label
              htmlFor={`perm-${item.title}`}
              className="cursor-pointer text-sm font-medium flex-grow"
            >
              {item.title}
              {hasChildren && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({item.items?.length} items)
                </span>
              )}
            </Label>
          </div>

          {hasChildren && isExpanded && item.items && (
            <div className="mt-1">{renderMenuItems(item.items, level + 1)}</div>
          )}
        </div>
      );
    });

  const isFormValid = roleName.trim() && selectedPermissions.size > 0;

  // ---- UI ----
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Rol</DialogTitle>
          <DialogDescription>
            Define el nombre del rol y selecciona los permisos correspondientes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Nombre del rol */}
          <div className="space-y-2">
            <Label htmlFor="roleName">Nombre del Rol *</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ej: Supervisor de Taller"
              maxLength={50}
            />
          </div>

          {/* Permisos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Permisos y Accesos *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAllPermissions}
                className="h-8 text-xs"
              >
                {selectedPermissions.size === allPermissions.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar permisos..."
                className="pl-9 pr-9"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-accent rounded p-1"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Árbol de permisos */}
            <div className="border rounded-lg bg-muted/30 max-h-80 overflow-y-auto">
              <div className="p-3">
                {filteredMenuItems.length > 0 ? (
                  renderMenuItems(filteredMenuItems)
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No se encontraron permisos
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Permisos seleccionados:{" "}
                <strong>{selectedPermissions.size}</strong> de{" "}
                {allPermissions.length}
              </span>
            </div>
          </div>

          {/* JSON Preview */}
          {/*{selectedPermissions.size > 0 && (
            <details className="border rounded-lg bg-muted/20">
              <summary className="cursor-pointer p-3 text-sm font-medium hover:bg-muted/40 rounded-lg transition-colors">
                Vista previa del JSON
              </summary>
               <pre className="p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(buildPayload(), null, 2)}
              </pre> 
            </details>
          )}*/}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreateRole} disabled={!isFormValid || loading}>
            {loading ? "Creando..." : "Crear Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
