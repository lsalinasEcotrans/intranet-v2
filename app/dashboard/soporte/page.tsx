"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// 📦 IMPORTS DE DATA
import { zelloManual } from "./data/zello";

// 🔹 TIPOS
type Solucion = {
  categoria: string;
  pregunta: string;
  pasos?: string[];
  contenido?: React.ReactNode;
  datos?: {
    usuario: string;
    password: string;
    network: string;
  };
  imagenes?: string[];
};

// 🔥 DATA LOCAL
const baseSoluciones: Solucion[] = [
  {
    categoria: "general",
    pregunta: "No puedo iniciar sesión",
    pasos: [
      "Verifica que el usuario esté correctamente escrito.",
      "Confirma que la contraseña sea correcta.",
      "Revisa conexión con la API de autenticación.",
    ],
  },
  {
    categoria: "reservas",
    pregunta: "Error al guardar reserva",
    pasos: [
      "Verifica que todos los campos estén completos.",
      "Asegúrate que grupo_numero sea tipo string.",
      "Revisa errores en consola o backend.",
    ],
  },
  {
    categoria: "usuarios",
    pregunta: "No aparecen usuarios",
    pasos: [
      "Verifica permisos del usuario.",
      "Confirma conexión con la API.",
      "Revisa si existen datos en la base.",
    ],
  },
];

// 🔗 UNIFICAR TODO
const soluciones: Solucion[] = [...baseSoluciones, ...zelloManual];

export default function SoportePage() {
  const [busqueda, setBusqueda] = useState("");

  // 🔎 FILTRO GLOBAL
  const filtradas = soluciones.filter((item) =>
    (item.pregunta + (item.pasos ? item.pasos.join(" ") : ""))
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  // 🔹 RENDER ACCORDION
  const renderAccordion = (categoria: string) => {
    const data = filtradas.filter((s) => s.categoria === categoria);

    if (data.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Sin resultados en esta categoría
        </p>
      );
    }

    return (
      <Accordion type="single" collapsible>
        {data.map((item, index) => (
          <AccordionItem key={index} value={`item-${categoria}-${index}`}>
            <AccordionTrigger>{item.pregunta}</AccordionTrigger>

            <AccordionContent className="space-y-4">
              {/* 🔥 CONTENIDO JSX (manual avanzado) */}
              {item.contenido && <>{item.contenido}</>}

              {/* 📝 PASOS */}
              {item.pasos && (
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {item.pasos.map((paso, i) => (
                    <li key={i}>
                      <strong>Paso {i + 1}:</strong> {paso}
                    </li>
                  ))}
                </ol>
              )}

              {/* 🔐 DATOS */}
              {item.datos && (
                <div className="text-sm space-y-1 bg-muted p-3 rounded-lg border">
                  <p>
                    <strong>Usuario:</strong> {item.datos.usuario}
                  </p>
                  <p>
                    <strong>Contraseña:</strong> {item.datos.password}
                  </p>
                  <p>
                    <strong>Network:</strong> {item.datos.network}
                  </p>
                </div>
              )}

              {/* 🖼️ IMÁGENES */}
              {item.imagenes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.imagenes.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Paso ${i + 1}`}
                      className="rounded-xl border"
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* 🧠 TÍTULO */}
      <h1 className="text-2xl font-bold">Centro de Soporte</h1>

      {/* 💬 MENSAJE INICIAL */}
      <div className="p-6 rounded-2xl border bg-muted/40">
        <h2 className="text-xl font-semibold">Centro de Soluciones</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Aquí encontrarás soluciones a los problemas más comunes del sistema.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Usa el buscador para encontrar respuestas más rápido.
        </p>
      </div>

      {/* 🔎 BUSCADOR */}
      <Input
        placeholder="Buscar solución..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="max-w-md"
      />

      {/* 📂 CONTENIDO */}
      {busqueda ? (
        <div className="space-y-6">
          {["general", "reservas", "usuarios", "moviles"].map((cat) => (
            <div key={cat}>
              <h3 className="text-lg font-semibold capitalize mb-2">{cat}</h3>
              {renderAccordion(cat)}
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="moviles">Móviles</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {renderAccordion("general")}
          </TabsContent>
          <TabsContent value="reservas">
            {renderAccordion("reservas")}
          </TabsContent>
          <TabsContent value="usuarios">
            {renderAccordion("usuarios")}
          </TabsContent>
          <TabsContent value="moviles">
            {renderAccordion("moviles")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
