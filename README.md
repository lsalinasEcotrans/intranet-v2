# Intranet Corporativa V2

Este proyecto es una **intranet corporativa** desarrollada con **Next.js (App Router)**, **React**, **TailwindCSS**, **React Query**, **Axios** y **autenticación basada en cookies HttpOnly**.
Está pensado para manejar **rutas públicas y privadas**, con integración a APIs externas (Ghost, Microsoft Graph) y módulos especializados para gestión de usuarios, correos, pasajeros y más.

---

## 🚀 Tecnologías principales

| Herramienta                      | Uso                                                           |
| -------------------------------- | ------------------------------------------------------------- |
| **Next.js 15**                   | Framework principal (App Router)                              |
| **React 19**                     | UI moderna y reactiva                                         |
| **Shadcn/UI**                    | Componentes estilizados con Tailwind                          |
| **TailwindCSS 4**                | Sistema de estilos                                            |
| **Axios**                        | Cliente HTTP para consumo de APIs                             |
| **TanStack Query (React Query)** | Manejo de estados asíncronos (fetching, caching, etc.)        |
| **Zod**                          | Validaciones y tipos                                          |
| **XLSX**                         | Procesamiento de cargas masivas desde Excel                   |
| **Socket.io**                    | Comunicación en tiempo real (futuro módulo de notificaciones) |
| **Nodemailer**                   | Envío de correos desde el backend                             |
| **Leaflet**                      | Mapas interactivos                                            |
| **TinyMCE**                      | Editor de texto enriquecido                                   |
| **Microsoft Graph API**          | Integración con Outlook 365                                   |
| **Lucide React**                 | Iconos SVG                                                    |
| **Next Themes**                  | Soporte para modo oscuro/claro                                |

## Base de datos – Siglas de módulos

AUTH = Autenticación de usuarios y gestión de permisos (login, validación, roles, accesos)
OWA = Lectura y uso de correo electrónico Microsoft 365 (recepción, lectura y reenvío)
GHOST = API para reservas de clientes y autocomplete de direcciones
GRAPH = Integración con Microsoft Graph para Outlook
AMIGO-SECRETO = Módulo de sorteo navideño con envío de correos
PASAJEROS = Gestión de datos de pasajeros con coordenadas GPS

## 🔹 Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/              # Ruta del dashboard (privada)
│   │   ├── correos/            # Módulo de correos OWA
│   │   ├── usuarios/           # Gestión de usuarios y roles
│   │   ├── tombola/            # Amigo secreto
│   │   ├── mantenedor/         # Módulos de mantenimiento (angloamerican, etc.)
│   │   ├── soporte/            # Soporte técnico
│   │   └── test/               # Página de pruebas
│   ├── login/                  # Ruta de login (pública)
│   ├── cambiar-contrasena/     # Cambio de contraseña
│   ├── recuperar-contrasena/   # Recuperación de contraseña
│   ├── owacorreo/              # Visor de correos
│   ├── popup/[id]/             # Popups dinámicos
│   ├── privacy-policy/         # Política de privacidad
│   ├── api/                    # APIs integradas en Next.js
│   │   ├── auth/               # Autenticación
│   │   ├── ghost/              # Reservas y autocomplete
│   │   ├── graph/              # Microsoft Graph
│   │   ├── owa/                # Outlook Web Access
│   │   ├── amigo-secreto/      # Sorteo navideño
│   │   └── pasajeros/          # Gestión de pasajeros
│   ├── layout.tsx              # Layout global
│   ├── page.tsx                # Redirección inicial
│   └── globals.css
│
├── components/
│   ├── ui/                     # Componentes Shadcn/UI (40+ componentes)
│   └── otros componentes reutilizables (app-sidebar, nav-*, etc.)
│
├── hooks/                      # Hooks globales reutilizables
│   ├── use-mobile.ts           # Detección de dispositivos móviles
│   └── useAutocomplete.ts      # Autocomplete de direcciones
│
├── lib/
│   ├── axiosClient.ts          # Configuración global de Axios (pendiente)
│   ├── endpoints.ts            # URLs centralizadas (básico)
│   ├── auth.ts                 # Funciones de autenticación (pendiente)
│   ├── types.ts                # Interfaces TypeScript
│   ├── utils.ts                # Helpers generales
│   └── getPageTitle.ts         # Títulos dinámicos por ruta
│
├── style/                      # Tailwind / temas personalizados
├── public/                     # Assets estáticos
├── logs/                       # Logs de operaciones (amigo-secreto)
└── archivos de configuración (next.config.ts, tsconfig.json, etc.)
```

---

## 🔹 Funcionalidades principales

- **Autenticación segura**
  - Token guardado en **cookie HttpOnly** (no accesible desde JS)
  - Datos del usuario guardados en **cookies públicas** (user_data, user_menu)
  - Middleware revisa la cookie para proteger rutas privadas
  - Integración con API externa Ghost y API interna para validación

- **Rutas públicas y privadas**
  - Públicas: `/login`, `/cambiar-contrasena`, `/recuperar-contrasena`, `/privacy-policy`, `/owacorreo`
  - Privadas: `/dashboard/*` (requiere autenticación)

- **Módulos especializados**
  - **Usuarios**: CRUD de usuarios y gestión de roles
  - **Correos**: Lectura y gestión de correos desde Outlook 365
  - **Amigo Secreto**: Sorteo navideño con envío automático de correos
  - **Pasajeros**: Gestión de datos de pasajeros con mapas
  - **Mantenedor**: Módulos específicos como Anglo American (viajes, turnos)

- **APIs integradas**
  - Autenticación contra Ghost API y API interna
  - Microsoft Graph para Outlook
  - Autocomplete de direcciones
  - Envío de correos con Nodemailer

- **UI moderna**
  - Tema claro/oscuro con next-themes
  - Componentes Shadcn/UI
  - Responsive design
  - Notificaciones con Sonner

- **Estado y datos**
  - TanStack Query para manejo de datos asíncronos
  - Zustand instalado pero no implementado (pendiente)
  - Cookies para estado de sesión

---

## 🔹 APIs implementadas

### Autenticación (`/api/auth/`)

- `POST /api/auth/login`: Login con validación doble (Ghost + intranet)
- `POST /api/auth/logout`: Limpieza de cookies

### Ghost (`/api/ghost/`)

- `GET /api/ghost/autocomplete`: Autocomplete de direcciones
- `GET /api/ghost/customers`: Lista de clientes
- `POST /api/ghost/bookings/create`: Crear reserva
- `GET /api/ghost/bookings/details`: Detalles de reserva

### Microsoft Graph (`/api/graph/`)

- `POST /api/graph`: Acceso a Outlook 365 (mensajes, usuario)

### OWA (`/api/owa/`)

- Lectura de correos desde Outlook Web Access

### Amigo Secreto (`/api/amigo-secreto/`)

- `POST /api/amigo-secreto`: Genera sorteo y envía correos

### Pasajeros (`/api/pasajeros/`)

- Gestión de datos de pasajeros con coordenadas GPS

---

## 🔹 Hooks personalizados

- `useIsMobile()`: Detecta si la pantalla es menor a 768px
- `useAutocomplete(text)`: Autocomplete de direcciones con debounce

---

## 🔹 Reglas para contribuir

1. Cada **módulo** debe tener su propia carpeta en `app/dashboard/`
2. Los **componentes reutilizables** van en `components/`
3. Las **funciones compartidas** van en `lib/`
4. **Endpoints** se agregan únicamente en `lib/endpoints.ts`
5. Respetar nombres de rutas públicas y privadas para middleware
6. Usar TypeScript para todas las interfaces y validaciones con Zod

---

## 🔹 Cómo empezar

1. Clonar el repositorio:

```bash
git clone https://github.com/lsalinasEcotrans/intranet-v2.git
cd intranet-v2
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env.local` con las variables de entorno:

```env
NEXT_PUBLIC_API_PROTOCOL=https
NEXT_PUBLIC_API_ENDPOINT_PROD=ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app
NEXT_PUBLIC_API_PORT=29003
NEXT_PUBLIC_API_INTRANET=https://ecotrans-intranet-370980788525.europe-west1.run.app
TENANT_ID=<tu-tenant-id>
CLIENT_ID=<tu-client-id>
CLIENT_SECRET=<tu-client-secret>
USER_EMAIL=<usuario@ecotrans.com>
```

4. Ejecutar proyecto en modo desarrollo:

```bash
npm run dev
```

5. Acceder a la intranet:
   - Público: `http://localhost:3000/login`
   - Privado: `http://localhost:3000/dashboard` (requiere login)

---

## 🔹 Buenas prácticas

- Usar **hooks y components** reutilizables para mantener código limpio
- Mantener **endpoints centralizados** en `lib/endpoints.ts`
- Nunca almacenar el **token** en `localStorage` en producción
- Seguir la estructura de carpetas para que el proyecto sea escalable
- Usar **Zod** para validaciones de datos
- Implementar **TanStack Query** para fetching de datos

---

## 🔹 Próximos pasos sugeridos

- Implementar Zustand para estado global (reemplazar cookies donde sea necesario)
- Centralizar configuración de Axios en `lib/axiosClient.ts`
- Agregar tests unitarios y e2e
- Implementar Socket.io para notificaciones en tiempo real
- Mejorar integración con Excel (XLSX) para cargas masivas
- Agregar rate limiting y 2FA
- Documentar APIs con Swagger/OpenAPI
- Refactor hacia arquitectura modular con `/features/` si crece el proyecto

---
