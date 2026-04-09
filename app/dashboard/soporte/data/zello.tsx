import React from "react";
import { ClipboardIcon } from "lucide-react"; // puedes usar lucide-react o cualquier otra librería de iconos

export const zelloManual = [
  {
    categoria: "moviles",
    pregunta: "Cómo configurar Zello",
    contenido: (
      <div className="space-y-4 text-sm">
        <p>Para configurar Zello, sigue los siguientes pasos:</p>

        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Descargar la aplicación desde App Store o Play Store.
            <div className="mt-1 space-y-1">
              <div className="flex items-center">
                <span>
                  <strong>Enlace para iOS:</strong>{" "}
                  https://apps.apple.com/cl/app/zello-walkie-talkie/id508231856
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      "https://apps.apple.com/cl/app/zello-walkie-talkie/id508231856",
                    )
                  }
                  className="p-1 rounded hover:bg-gray-200"
                  title="Copiar enlace"
                >
                  <ClipboardIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center">
                <span>
                  <strong>Enlace para Android:</strong>{" "}
                  https://play.google.com/store/apps/details?id=com.loudtalks
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      "https://play.google.com/store/apps/details?id=com.loudtalks",
                    )
                  }
                  className="p-1 rounded hover:bg-gray-200"
                  title="Copiar enlace"
                >
                  <ClipboardIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lado izquierdo */}
          <div className="space-y-4">
            <ol className="bg-muted p-3 rounded-lg border list-disc pl-7 space-y-1">
              <li>Abrir la aplicación.</li>
              <li>
                Seleccionar <strong>Zello Work</strong>.
              </li>
            </ol>

            <img
              src="/manuales/zello/Zello1.jpg"
              alt="Paso 1"
              className="rounded-xl border"
              width={300}
            />
          </div>

          {/* Lado derecho */}
          <div className="space-y-2">
            <ol className="bg-muted p-3 rounded-lg border list-disc pl-7 space-y-1">
              <li>
                <strong>Usuario:</strong> movilXXX
              </li>
              <li>
                <strong>Contraseña:</strong> PATENTE EN MAYÚSCULAS
              </li>
              <li>
                <strong>Network:</strong> ecotranschilesa.zellowork.com
              </li>
            </ol>
            <img
              src="/manuales/zello/Zello2.jpg"
              alt="Paso 2"
              className="rounded-xl border"
              width={290}
            />
          </div>
        </div>
      </div>
    ),
  },
];
