// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

const VALIDATE_API =
  "https://ecotrans-intranet-370980788525.europe-west1.run.app/validate";

// 🔍 Sanitizador simple (evita caracteres raros / inyección)
function sanitize(text: string) {
  return text.replace(/[<>"'`;]/g, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Solicitud inválida" },
        { status: 400 }
      );
    }

    let { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    // Sanitiza inputs
    username = sanitize(username);
    password = sanitize(password);

    if (!username || !password) {
      return NextResponse.json(
        { error: "Credenciales requeridas" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 1) AUTENTICACIÓN (Axios)
    // ---------------------------------------------------
    const authUrl =
      "https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/authenticate";

    let authData;
    try {
      const authResponse = await axios.post(authUrl, {
        username,
        password,
      });
      authData = authResponse.data;
    } catch {
      // 🔒 seguridad: no revelamos si fue user o pass
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    if (!authData.secret || !authData.user?.name) {
      return NextResponse.json(
        { error: "Autenticación fallida" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------
    // 2) VALIDACIÓN EN SISTEMA INTERNO
    // ---------------------------------------------------
    const validatedUserName = sanitize(authData.user.name);

    let userData;
    try {
      const validateRes = await axios.get(
        `${VALIDATE_API}/${validatedUserName}`
      );
      userData = validateRes.data;
    } catch {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    if (!userData?.id || !userData?.username) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 403 });
    }

    // ---------------------------------------------------
    // 3) SET COOKIES SEGURAS
    // ---------------------------------------------------
    const cookieStore = await cookies();

    // Token secreto (solo servidor)
    cookieStore.set("auth_token", authData.secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // User público (solo información segura, no sensible)
    cookieStore.set(
      "user_data",
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        role: userData.role_name,
        cargo: userData.cargo,
        departamento: userData.departamento,
        nexterno: userData.nexterno,
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    // Menú
    cookieStore.set("user_menu", JSON.stringify(userData.json_menu), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // ---------------------------------------------------
    // OK
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        role: userData.role_name,
        menu: userData.json_menu,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
