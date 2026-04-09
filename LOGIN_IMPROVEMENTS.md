# Mejoras al Sistema de Login

## ✅ Cambios Implementados

### 1. **Backend (`app/api/auth/login/route.ts`)**

#### Sanitización Mejorada

- ✅ Se eliminan más caracteres peligrosos: `%;()`
- ✅ Se normalizan espacios múltiples
- ✅ Validación robusta de longitud de inputs

```typescript
function sanitize(text: string): string {
  return text
    .replace(/[<>"'`%;()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
```

#### Validación de Credenciales

- ✅ Valida longitud mínima (3 caracteres) y máxima (100)
- ✅ Previene campos vacíos o malformados

#### Nuevas Validaciones de Estado de Usuario

- ✅ **Usuario Suspendido**: Si `isSuspended = 0`, rechaza login
- ✅ **Contraseña Expirada**: Verifica `password_expires_at` contra la fecha actual
- ✅ **Cambio Forzado de Contraseña**: Si `isSuspended = 2`, redirige a cambio de contraseña
- ✅ **Advertencia de Expiración Próxima**: Alerta si contraseña vence en 3 días

```typescript
// Ejemplo de respuesta si contraseña expiró
{
  "error": "Tu contraseña ha expirado",
  "requiresPasswordChange": true,
  "redirectTo": "/cambiar-contrasena"
}
```

#### Información Almacenada en Cookies

- ✅ Ahora incluye: `correo`, `passwordExpiringWarning`
- ✅ Mantiene seguridad: información sensible solo en `httpOnly`

### 2. **Frontend (`app/login/page.tsx`)**

#### Mejor Manejo de Errores

- ✅ Validación básica antes de enviar (usuario y contraseña no vacíos)
- ✅ Manejo específico de casos: usuario suspendido, contraseña expirada
- ✅ Detección de cambio forzado de contraseña con redirección automática

#### Mejora de UX

- ✅ Mensaje diferenciado para errores vs advertencias
- ✅ Alert warning (amarillo) para contraseña próxima a expirar
- ✅ Iconos visuales (_AlertCircle_, _AlertTriangle_)
- ✅ `autoComplete` en campos (mejora experiencia)

```typescript
// Ejemplo de manejo de advertencia
if (data.user?.passwordExpiringWarning) {
  setWarning(`⚠️ ${data.user.passwordExpiringWarning.message}`);
  setTimeout(() => router.push("/dashboard"), 2000);
}
```

---

## 📋 Flujos de Login Ahora Soportados

| Caso                         | Comportamiento                                                |
| ---------------------------- | ------------------------------------------------------------- |
| **Credenciales Inválidas**   | Error inmediato sin detallar si fue user o pass               |
| **Usuario Suspendido**       | Error: "Usuario suspendido. Contacta con administrador" (403) |
| **Contraseña Expirada**      | Redirige automáticamente a `/cambiar-contrasena` (403)        |
| **Cambio Forzado Requerido** | Redirige a `/cambiar-contrasena` (403)                        |
| **Contraseña Vence Pronto**  | Login exitoso + Warning visual sobre expiración               |
| **Login Normal**             | Redirige a `/dashboard`                                       |

---

## 🔐 Mejoras de Seguridad

1. **Sanitización Mejorada**: Elimina más caracteres peligrosos
2. **Validación Robusta**: Verifica longitud y tipo de datos
3. **Validación de Estado**: Previene acceso de usuarios no autorizados
4. **Mensajes Seguros**: No revela si usuario existe o contraseña es correcta
5. **Cookies Seguras**: `httpOnly`, `secure`, `sameSite=lax`

---

## 🎯 Recomendaciones Adicionales (No Implementadas Aún)

### 1. **Rate Limiting**

```typescript
// Implementar límite de intentos de login fallidos
// Por IP: máx 5 intentos en 15 minutos
// Por usuario: máx 10 intentos en 1 hora
```

### 2. **Auditoría de Logins**

```sql
-- Crear tabla para registrar intentos
CREATE TABLE `LOGIN_AUDIT` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(100),
  `ip_address` VARCHAR(45),
  `success` BOOLEAN,
  `error_reason` VARCHAR(255),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **Recuperación Segura de Contraseña**

- Usar tokens de un solo uso (JWT con expiración corta)
- Validar cambio de contraseña desde email confirmado

### 4. **2FA (Autenticación de Dos Factores)**

- SMS o Email para verificación adicional
- App de autenticación como Google Authenticator

### 5. **Mejora de Contraseña Expirada**

```typescript
// En lugar de redirigir, permitir cambio en el mismo formulario
// O mostrar modal sin salir del dashboard
```

### 6. **Validación de Contraseña Fuerte**

```typescript
// Al cambiar contraseña, validar:
// - Mínimo 8 caracteres
// - Mayúscula, minúscula, número, especial
// - No usar caracteres previos
```

---

## 📊 Tabla de Referencia de `isSuspended`

| Valor  | Significado                | Acción                             |
| ------ | -------------------------- | ---------------------------------- |
| `0`    | Suspendido                 | ❌ Rechaza login                   |
| `1`    | Activo                     | ✅ Login normal                    |
| `2`    | Requiere cambio contraseña | 🔄 Redirige a cambio               |
| `NULL` | No definido                | ⚠️ Tratar como activo (revisar BD) |

---

## 🔄 Próximos Pasos Recomendados

1. **Ejecutar migraciones BD**: Asegurar que `password_expires_at` se actualiza al cambiar contraseña
2. **Configurar política de expiración**: Definir cada cuántos días expira la contraseña
3. **Implementar rate limiting**: Prevenir ataques de fuerza bruta
4. **Agregar auditoría**: Registrar todos los intentos de login
5. **Pruebas**: Verificar manualmente cada flujo de login

---

## 🧪 Casos de Prueba Recomendados

```bash
# 1. Usuario normal y contraseña correcta
POST /api/auth/login
{ "username": "jdoe", "password": "password123" }
→ Esperado: 200 OK, redirige a /dashboard

# 2. Usuario suspendido
# (Cambiar isSuspended=0 en BD)
{ "username": "suspended_user", "password": "correct" }
→ Esperado: 403, "Usuario suspendido"

# 3. Contraseña expirada
# (Cambiar password_expires_at a fecha pasada)
{ "username": "expired_user", "password": "correct" }
→ Esperado: 403, redirige a /cambiar-contrasena

# 4. Cambio forzado
# (Cambiar isSuspended=2 en BD)
{ "username": "change_required", "password": "correct" }
→ Esperado: 403, redirige a /cambiar-contrasena

# 5. Contraseña próxima a expirar (3 días)
# (Cambiar password_expires_at a fecha en 2 días)
{ "username": "expiring_soon", "password": "correct" }
→ Esperado: 200 OK, warning visible, acceso permitido
```

---

**Última actualización**: 24 de marzo de 2026
