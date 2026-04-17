"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Persona = {
  id: number;
  rut: string;
  nombre: string;
};

type Grupo = {
  id: number;
  nombre: string;
  destino: string;
  personas: Persona[];
};

type Tab = {
  id: number;
  nombre: string;
  grupos: Grupo[];
};

export default function MockupDinamico() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);

  // ===============================
  // LOCAL STORAGE
  // ===============================
  useEffect(() => {
    const saved = localStorage.getItem("mock_tabs");
    if (saved) {
      const parsed = JSON.parse(saved);
      setTabs(parsed);
      if (parsed.length > 0) setActiveTab(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mock_tabs", JSON.stringify(tabs));
  }, [tabs]);

  // ===============================
  // CREAR TAB
  // ===============================
  const crearTab = () => {
    const nombre = prompt("Nombre del Tab");
    if (!nombre) return;

    const newTab: Tab = {
      id: Date.now(),
      nombre,
      grupos: [],
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  // ===============================
  // CREAR GRUPO
  // ===============================
  const crearGrupo = () => {
    if (!activeTab) return;

    const nombre = prompt("Número o nombre del grupo");
    if (!nombre) return;

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              grupos: [
                ...tab.grupos,
                { id: Date.now(), nombre, destino: "", personas: [] },
              ],
            }
          : tab,
      ),
    );
  };

  // ===============================
  // AGREGAR PERSONA
  // ===============================
  const agregarPersona = (grupoId: number) => {
    const rut = prompt("RUT");
    const nombre = prompt("Nombre");

    if (!rut || !nombre) return;

    const persona: Persona = {
      id: Date.now(),
      rut,
      nombre,
    };

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              grupos: tab.grupos.map((g) =>
                g.id === grupoId
                  ? { ...g, personas: [...g.personas, persona] }
                  : g,
              ),
            }
          : tab,
      ),
    );
  };

  // ===============================
  // QUITAR PERSONA
  // ===============================
  const eliminarPersona = (grupoId: number, personaId: number) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              grupos: tab.grupos.map((g) =>
                g.id === grupoId
                  ? {
                      ...g,
                      personas: g.personas.filter((p) => p.id !== personaId),
                    }
                  : g,
              ),
            }
          : tab,
      ),
    );
  };

  // ===============================
  // ACTUALIZAR DESTINO
  // ===============================
  const actualizarDestino = (grupoId: number, destino: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? {
              ...tab,
              grupos: tab.grupos.map((g) =>
                g.id === grupoId ? { ...g, destino } : g,
              ),
            }
          : tab,
      ),
    );
  };

  // ===============================
  // GUARDAR (MOCK)
  // ===============================
  const handleSave = () => {
    console.log("DATA A GUARDAR:", tabs);
    alert("Datos listos para enviar a API (ver consola)");
  };

  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Mockup Dinámico</h1>

        <div className="flex gap-2">
          <Button onClick={crearTab}>Crear Tab</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t ${
              activeTab === tab.id ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            {tab.nombre}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {currentTab && (
        <div className="space-y-4">
          {/* CREAR GRUPO */}
          <Button onClick={crearGrupo}>Nuevo Grupo</Button>

          {/* GRUPOS */}
          {currentTab.grupos.length === 0 ? (
            <p className="text-muted-foreground">No hay grupos creados</p>
          ) : (
            currentTab.grupos.map((grupo) => (
              <div key={grupo.id} className="border rounded p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <h2 className="font-semibold">Grupo: {grupo.nombre}</h2>

                  <select
                    value={grupo.destino}
                    onChange={(e) =>
                      actualizarDestino(grupo.id, e.target.value)
                    }
                    className="border rounded p-1 text-sm"
                  >
                    <option value="">Seleccionar destino</option>
                    <option value="destino1">Destino 1</option>
                    <option value="destino2">Destino 2</option>
                    <option value="destino3">Destino 3</option>
                  </select>

                  <Button size="sm" onClick={() => agregarPersona(grupo.id)}>
                    Agregar Persona
                  </Button>
                </div>

                {/* PERSONAS */}
                {grupo.personas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin personas</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left">RUT</th>
                        <th className="text-left">Nombre</th>
                        <th className="text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.personas.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td>{p.rut}</td>
                          <td>{p.nombre}</td>
                          <td className="text-right">
                            <button
                              onClick={() => eliminarPersona(grupo.id, p.id)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
