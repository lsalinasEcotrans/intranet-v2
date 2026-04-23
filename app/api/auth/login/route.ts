// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const VALIDATE_API =
  "https://ecotrans-intranet-370980788525.europe-west1.run.app/validate";

const AUTH_API =
  "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/authenticate";

/* ============================
   🧼 SANITIZE (solo username)
============================ */
function sanitize(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/[<>"'`%;()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================
   🔐 VALIDACIÓN
============================ */
function validateCredentials(
  username: string,
  password: string,
): string | null {
  if (!username || username.length < 3 || username.length > 100) {
    return "Usuario inválido";
  }
  if (!password || password.length < 1 || password.length > 255) {
    return "Contraseña inválida";
  }
  return null;
}

/* ============================
   🧠 MERGE PERMISOS
============================ */
function mergePermissions(menu: any[], extra: any) {
  if (!extra) return menu;

  let newMenu = [...menu];

  // 🔹 módulos extra
  if (extra.modules) {
    extra.modules.forEach((mod: any) => {
      const exists = newMenu.find((m) => m.title === mod.title);
      if (!exists) newMenu.push(mod);
    });
  }

  // 🔹 super admin (acceso total)
  if (extra.flags?.super_admin) {
    return menu; // o podrías devolver menú completo del sistema
  }

  return newMenu;
}

/* ============================
   🚀 LOGIN
============================ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Solicitud inválida" },
        { status: 400 },
      );
    }

    let { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 },
      );
    }

    // 🔹 sanitize SOLO username
    username = sanitize(username);

    const validationError = validateCredentials(username, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    /* ============================
       1) AUTH EXTERNO
    ============================ */
    let authData;
    try {
      const res = await axios.post(AUTH_API, { username, password });
      authData = res.data;
    } catch {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      );
    }

    if (!authData.secret || !authData.user?.name) {
      return NextResponse.json(
        { error: "Autenticación fallida" },
        { status: 401 },
      );
    }

    /* ============================
       2) VALIDACIÓN INTERNA
    ============================ */
    const validatedUserName = sanitize(authData.user.name);

    let userData;
    try {
      const res = await axios.get(`${VALIDATE_API}/${validatedUserName}`);
      userData = res.data;
    } catch {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 },
      );
    }

    if (!userData?.id || !userData?.username) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 403 });
    }

    /* ============================
       3) VALIDACIONES DE ESTADO
    ============================ */
    if (userData.isSuspended === 0) {
      return NextResponse.json(
        { error: "Usuario suspendido" },
        { status: 403 },
      );
    }

    if (userData.isSuspended === 2) {
      return NextResponse.json(
        {
          error: "Debes cambiar tu contraseña",
          requiresPasswordChange: true,
          redirectTo: "/cambiar-contrasena",
        },
        { status: 403 },
      );
    }

    /* ============================
       4) PASSWORD EXPIRY
    ============================ */
    if (userData.password_expires_at) {
      const expiryDate = new Date(userData.password_expires_at);
      const today = new Date();

      if (expiryDate < today) {
        return NextResponse.json(
          {
            error: "Contraseña expirada",
            requiresPasswordChange: true,
            redirectTo: "/cambiar-contrasena",
          },
          { status: 403 },
        );
      }

      const diffDays = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays <= 3) {
        userData.passwordExpiringWarning = {
          message: `Tu contraseña expira en ${diffDays} días`,
          daysLeft: diffDays,
        };
      }
    }

    /* ============================
       5) MERGE PERMISOS
    ============================ */
    const finalMenu = mergePermissions(
      userData.json_menu,
      userData.extra_permissions,
    );

    /* ============================
       6) COOKIES
    ============================ */
    const cookieStore = await cookies();

    // 🔐 token seguro (server only)
    cookieStore.set("auth_token", authData.secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // 👤 user público
    cookieStore.set(
      "user_data",
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        cargo: userData.cargo,
        departamento: userData.departamento,
        role: userData.role_name,
        extra_permissions: userData.extra_permissions || null,
        passwordExpiringWarning: userData.passwordExpiringWarning || null,
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    // 📋 menú final
    cookieStore.set("user_menu", JSON.stringify(finalMenu), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    /* ============================
       OK
    ============================ */
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        cargo: userData.cargo,
        departamento: userData.departamento,
        role: userData.role_name,
        menu: finalMenu,
        extra_permissions: userData.extra_permissions || null,
        passwordExpiringWarning: userData.passwordExpiringWarning || null,
      },
    });
  } catch (error: any) {
    console.error("❌ Error login:", error);

    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.detail || "Error" },
        { status: error.response.status },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
