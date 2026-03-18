"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  ClipboardCheck,
} from "lucide-react";

// 1. Configuración de la Inspección (Escalable)
const SECTIONS = [
  {
    id: "general",
    label: "General",
    fields: [
      { id: "plate", label: "Patente", type: "text" },
      { id: "mileage", label: "Kilometraje", type: "number" },
    ],
  },
  {
    id: "safety",
    label: "Seguridad",
    fields: [
      { id: "extintor", label: "Extintor", type: "toggle" },
      { id: "chaleco", label: "Chaleco", type: "toggle" },
      { id: "botiquin", label: "Botiquín", type: "toggle" },
    ],
  },
  {
    id: "wheels",
    label: "Ruedas",
    fields: [
      { id: "dd", label: "Delantera Derecha", type: "toggle" },
      { id: "di", label: "Delantera Izquierda", type: "toggle" },
      { id: "td", label: "Trasera Derecha", type: "toggle" },
      { id: "ti", label: "Trasera Izquierda", type: "toggle" },
    ],
  },
];

export default function VehicleInspection() {
  const [activeTab, setActiveTab] = useState("general");
  const [data, setData] = useState<any>({});
  const [photos, setPhotos] = useState<File[]>([]);

  // Handlers
  const handleToggle = (
    section: string,
    field: string,
    status: "ok" | "fail",
  ) => {
    setData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: status },
    }));
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  // Cálculo de progreso basado en campos completados
  const totalFields = SECTIONS.reduce((acc, sec) => acc + sec.fields.length, 0);
  const completedFields = SECTIONS.reduce((acc, sec) => {
    const sectionData = data[sec.id] || {};
    return acc + Object.keys(sectionData).length;
  }, 0);
  const progress = (completedFields / totalFields) * 100;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="text-blue-600" />
          Inspección Técnica
        </h1>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="h-2" />
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navegación Rápida */}
        <TabsList className="grid grid-cols-3 h-auto gap-2 bg-transparent">
          {SECTIONS.map((sec) => (
            <TabsTrigger
              key={sec.id}
              value={sec.id}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border p-2 rounded-lg"
            >
              {sec.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="summary" className="border p-2 rounded-lg">
            Resumen
          </TabsTrigger>
        </TabsList>

        {/* Contenido de Secciones */}
        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 p-3 border rounded-xl bg-card"
                  >
                    <span className="font-medium text-sm text-muted-foreground">
                      {field.label}
                    </span>

                    {field.type === "toggle" ? (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2"
                          variant={
                            data[section.id]?.[field.id] === "ok"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            handleToggle(section.id, field.id, "ok")
                          }
                        >
                          <CheckCircle2 className="w-4 h-4" /> Correcto
                        </Button>
                        <Button
                          className="flex-1 gap-2"
                          variant={
                            data[section.id]?.[field.id] === "fail"
                              ? "destructive"
                              : "outline"
                          }
                          onClick={() =>
                            handleToggle(section.id, field.id, "fail")
                          }
                        >
                          <AlertCircle className="w-4 h-4" /> Falla
                        </Button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={`Ingrese ${field.label.toLowerCase()}`}
                        onChange={(e) =>
                          handleInputChange(
                            section.id,
                            field.id,
                            e.target.value,
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Resumen Final */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Revisión Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50 text-center">
                  <p className="text-2xl font-bold">{photos.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Fotos capturadas
                  </p>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50 text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {
                      Object.values(data)
                        .flatMap((s: any) => Object.values(s))
                        .filter((v) => v === "fail").length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fallas detectadas
                  </p>
                </div>
              </div>
              <pre className="text-[10px] bg-muted p-2 overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Enviar Informe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra flotante para Fotos (Accesible siempre) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border shadow-2xl rounded-full p-2 flex items-center justify-between px-6">
        <span className="text-sm font-bold text-blue-600">
          {photos.length} fotos
        </span>
        <label className="cursor-pointer bg-blue-600 p-3 rounded-full text-white hover:bg-blue-700 transition-colors">
          <Camera size={24} />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
            accept="image/*"
          />
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("summary")}
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}
