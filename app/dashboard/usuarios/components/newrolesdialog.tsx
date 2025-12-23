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
  icon?: string | null;
  items?: MenuItem[];
  external?: boolean;
}

interface NewRoleDialogProps {
  onRoleCreated?: () => void;
}

/* ---------------- MENÚ BASE ---------------- */

const menuItems: MenuItem[] = [
  {
    title: "Operaciones",
    url: "#",
    icon: "Handshake",
    items: [
      { title: "Contratos", url: "#", external: false },
      { title: "Documentos", url: "#", external: false },
      { title: "Flota", url: "#", external: false },
      { title: "Revisiones", url: "#", external: false },
      { title: "Seguros", url: "#", external: false },
    ],
  },
  {
    title: "Contabilidad",
    url: "#",
    icon: "HandCoins",
    items: [{ title: "General1", url: "#", external: false }],
  },
  {
    title: "Facturacion",
    url: "#",
    icon: "FileCheck",
    items: [{ title: "General2", url: "#", external: false }],
  },
  {
    title: "Cargas Masivas",
    url: "#",
    icon: "Database",
    items: [
      { title: "Banco de Chile", url: "#", external: false },
      { title: "Hualpen", url: "#", external: false },
    ],
  },
  {
    title: "Locucion",
    url: "#",
    icon: "Headset",
    items: [
      { title: "Codigo Activacion", url: "#", external: false },
      { title: "Correos", url: "/dashboard/correos", external: false },
      { title: "EcotransGO", url: "#", external: false },
      { title: "Hualpen", url: "#", external: false },
      { title: "Libro Novedades", url: "#", external: false },
      { title: "Servicios Pendientes", url: "#", external: false },
      { title: "Suspendidos", url: "#", external: false },
      { title: "Turnos", url: "#", external: false },
      { title: "Turnos Moviles", url: "#", external: false },
      {
        title: "OWA Correo",
        url: "https://outlook.office.com/mail/",
        external: true,
      },
    ],
  },
  {
    title: "Reportes",
    url: "#",
    icon: "FileChartPieIcon",
    items: [{ title: "General3", url: "#", external: false }],
  },
  {
    title: "Taller",
    url: "#",
    icon: "Wrench",
    items: [
      { title: "OTs", url: "#", external: false },
      { title: "Presupuestos", url: "#", external: false },
    ],
  },
  {
    title: "Sistemas",
    url: "#",
    icon: "MonitorCog",
    items: [{ title: "Usuarios", url: "/dashboard/usuarios", external: false }],
  },
  {
    title: "Pruebas",
    url: "#",
    icon: "FlaskConical",
    items: [{ title: "Test", url: "/dashboard/test", external: false }],
  },
];

/* ---------------- COMPONENTE ---------------- */

export function NewRoleDialog({ onRoleCreated }: NewRoleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------- MAPAS PADRE / HIJO --------- */

  const parentChildMap = useMemo(() => {
    const parentToChildren = new Map<string, string[]>();
    const childToParent = new Map<string, string>();

    menuItems.forEach((parent) => {
      const children = parent.items?.map((c) => c.title) || [];
      parentToChildren.set(parent.title, children);
      children.forEach((child) => childToParent.set(child, parent.title));
    });

    return { parentToChildren, childToParent };
  }, []);

  const allPermissions = useMemo(
    () =>
      menuItems.flatMap((p) => [
        p.title,
        ...(p.items?.map((i) => i.title) || []),
      ]),
    []
  );

  /* --------- FILTRO --------- */

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) return menuItems;

    const term = searchTerm.toLowerCase();
    return menuItems
      .map((item) => {
        const matchesParent = item.title.toLowerCase().includes(term);
        const filteredChildren =
          item.items?.filter((c) => c.title.toLowerCase().includes(term)) || [];

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

  /* --------- AUTO EXPAND --------- */

  useMemo(() => {
    if (searchTerm.trim()) {
      setExpandedItems(new Set(filteredMenuItems.map((item) => item.title)));
    }
  }, [searchTerm, filteredMenuItems]);

  /* --------- TOGGLES --------- */

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const togglePermission = (title: string, hasChildren: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);

      if (hasChildren) {
        const children = parentChildMap.parentToChildren.get(title) || [];
        const selected = next.has(title);

        if (selected) {
          next.delete(title);
          children.forEach((c) => next.delete(c));
        } else {
          next.add(title);
          children.forEach((c) => next.add(c));
        }
      } else {
        const parent = parentChildMap.childToParent.get(title);
        next.has(title) ? next.delete(title) : next.add(title);

        if (parent) {
          const siblings = parentChildMap.parentToChildren.get(parent) || [];
          const allSelected = siblings.every((s) => next.has(s));
          allSelected ? next.add(parent) : next.delete(parent);
        }
      }

      return next;
    });
  };

  /* --------- BUILD PAYLOAD (FIX APLICADO) --------- */

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

        const items =
          parent.items
            ?.filter((i) => childrenSet.has(i.title))
            .map((i) => ({
              title: i.title,
              url: i.url,
              icon: i.icon ?? null,
              external: i.external ?? false, // ✅ FIX CLAVE
            })) || [];

        return {
          title: parent.title,
          url: parent.url,
          icon: parent.icon ?? null,
          items,
        };
      })
      .filter(Boolean);

    return {
      name: roleName.trim(),
      json_menu,
    };
  }, [selectedPermissions, roleName, parentChildMap]);

  /* --------- SUBMIT --------- */

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error("Ingresa un nombre para el rol");
      return;
    }

    if (selectedPermissions.size === 0) {
      toast.error("Selecciona al menos un permiso");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/roles",
        buildPayload()
      );
      toast.success("Rol creado correctamente");
      onRoleCreated?.();
      setIsOpen(false);
    } catch {
      toast.error("Error al crear el rol");
    } finally {
      setLoading(false);
    }
  };

  /* --------- RENDER MENU --------- */

  const renderMenuItems = (items: MenuItem[], level = 0) =>
    items.map((item) => {
      const hasChildren = !!item.items?.length;
      const isExpanded = expandedItems.has(item.title);
      const isSelected = selectedPermissions.has(item.title);

      return (
        <div key={item.title} className={level ? "ml-6" : ""}>
          <div className="flex items-center gap-2 py-2">
            {hasChildren ? (
              <button onClick={() => toggleExpanded(item.title)}>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}

            <Checkbox
              checked={isSelected}
              onCheckedChange={() => togglePermission(item.title, hasChildren)}
            />

            <span className="text-sm">{item.title}</span>
          </div>

          {hasChildren && isExpanded && renderMenuItems(item.items!, level + 1)}
        </div>
      );
    });

  /* --------- UI --------- */

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear Rol</DialogTitle>
          <DialogDescription>Selecciona los permisos del rol</DialogDescription>
        </DialogHeader>

        <Label>Nombre del rol</Label>
        <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} />

        <div className="border rounded-md p-3 max-h-80 overflow-y-auto mt-4">
          {renderMenuItems(filteredMenuItems)}
        </div>

        <DialogFooter>
          <Button onClick={handleCreateRole} disabled={loading}>
            {loading ? "Creando..." : "Crear Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
