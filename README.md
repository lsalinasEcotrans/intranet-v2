<!-- Datos de Inicio local -->

npm run dev

# or

yarn dev

# or

pnpm dev

# or

bun dev

<!-- Datos de Inicio local -->

# Intranet Corporativa V2

Este proyecto es una **intranet corporativa** desarrollada con **Next.js (App Router)**, **React**, **TailwindCSS**, **React Query**, **Zustand** y **Axios**.
Está pensado para manejar **rutas públicas y privadas**, con autenticación basada en **token seguro en cookie HttpOnly** y datos de usuario en **estado global (Zustand)**.

---

## 🔹 Estructura del proyecto

```
src/
├── app/                        # Rutas y páginas Next.js (App Router)
│   ├── layout.tsx              # Layout global, condicional para rutas privadas
│   └── page.tsx                # Dashboard principal (privado)
│
├── components/                 # Componentes reutilizables
│   ├── ui/                     # Botones, inputs, modales, etc.
│   └── layouts/                # Navbar, Sidebar, Layouts
│
├── features/                   # Módulos/secciones de la intranet
│   ├── usuarios/
│   │   ├── pages/              # Páginas específicas de usuarios
│   │   ├── components/         # Componentes del módulo usuarios
│   │   └── hooks/              # Hooks específicos del módulo
│   └── parametros/             # Otro módulo de ejemplo
│
├── lib/                        # Código compartido y utilidades
│   ├── axiosClient.ts          # Configuración global de Axios
│   ├── endpoints.ts            # URLs de APIs centralizadas
│   ├── auth.ts                 # Funciones de autenticación y manejo de token
│   └── utils.ts                # Helpers generales
│
├── hooks/                      # Hooks globales reutilizables
├── store/                      # Estado global (Zustand)
├── styles/                     # CSS / Tailwind / temas
└── types/                      # Interfaces TypeScript, validaciones Zod
```

---

## 🔹 Funcionalidades principales

- **Autenticación segura**

  - Token guardado en **cookie HttpOnly** (no accesible desde JS)
  - Datos del usuario guardados en **Zustand** (estado global para frontend)
  - Middleware revisa la cookie para proteger rutas privadas

- **Rutas públicas y privadas**

  - Públicas: `/login`, `/publico`
  - Privadas: `/dashboard`, `/usuarios`, `/cargas`, etc.

- **Gestión de APIs centralizada**

  - Archivo `lib/endpoints.ts` para tener todas las URLs de APIs internas y externas
  - `axiosClient.ts` con configuración global y envío automático de cookies

- **Módulos independientes**

  - Cada módulo tiene su propia carpeta con **páginas, componentes y hooks**
  - Facilita el trabajo de varios desarrolladores en paralelo

- **Estado global**

  - `store/` usa **Zustand** para manejar información de usuario y otros estados compartidos
  - Fácil de extender a otros módulos

- **React Query**

  - Manejo de consultas y caché de datos de manera eficiente

---

## 🔹 Reglas para contribuir

1. Cada **módulo** debe tener su propia carpeta en `features/`
2. Los **componentes reutilizables** van en `components/ui`
3. Las **funciones compartidas** van en `lib/`
4. El **estado global** se maneja en `store/`
5. **Endpoints** se agregan únicamente en `lib/endpoints.ts`
6. Respetar nombres de rutas públicas y privadas para middleware

---

## 🔹 Cómo empezar

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/intranet-v2.git
cd intranet-v2
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env.local` con las variables de entorno:

```env
NEXT_PUBLIC_API_BASE=https://tu-api.com
```

4. Ejecutar proyecto en modo desarrollo:

```bash
npm run dev
```

5. Acceder a la intranet:

   - Público: `http://localhost:3000/login`
   - Privado: `http://localhost:3000/` (requiere login)

---

## 🔹 Buenas prácticas

- Usar **hooks y components** reutilizables para mantener código limpio
- Mantener **endpoints centralizados**
- Nunca almacenar el **token** en `localStorage` en producción
- Seguir la estructura de carpetas para que el proyecto sea escalable

---

## 🔹 Próximos pasos sugeridos

- Integrar React Query con `axiosClient` y endpoints para cada módulo
- Crear módulos: Usuarios, Parámetros, Cargas, etc.
- Conectar correo corporativo y sistema de asignación de tareas
- Manejo de archivos Excel (`xlsx`) para cargas masivas
- Mejorar UI con `shadcn/ui` y TailwindCSS

---
