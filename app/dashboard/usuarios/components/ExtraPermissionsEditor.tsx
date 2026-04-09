"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon?: string;
  items?: MenuItem[];
}

interface Props {
  baseMenu: MenuItem[];
  value: any;
  onChange: (val: any) => void;
}

export function ExtraPermissionsEditor({ baseMenu, value, onChange }: Props) {
  const [selected, setSelected] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (value?.modules) {
      setSelected(value.modules);
    }
  }, [value]);

  const toggleModule = (module: MenuItem) => {
    const exists = selected.some((m) => m.title === module.title);

    let newModules: MenuItem[];

    if (exists) {
      newModules = selected.filter((m) => m.title !== module.title);
    } else {
      newModules = [...selected, module];
    }

    setSelected(newModules);
    onChange({ modules: newModules });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Permisos extra</h3>

      {baseMenu.map((mod) => {
        const isChecked = selected.some((m) => m.title === mod.title);

        // ✅ FIX ICON TYPE
        const IconComponent = mod.icon
          ? (Icons[mod.icon as keyof typeof Icons] as React.ComponentType<any>)
          : null;

        return (
          <div key={mod.title} className="border p-3 rounded-md">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleModule(mod)}
              />

              {/* ICONO */}
              {IconComponent && <IconComponent className="h-4 w-4" />}

              <span className="font-medium">{mod.title}</span>
            </label>

            {mod.items && mod.items.length > 0 && (
              <div className="ml-6 mt-2 space-y-1">
                {mod.items.map((sub) => (
                  <div
                    key={sub.title}
                    className="text-sm text-muted-foreground"
                  >
                    • {sub.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
