// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PROTOCOL = process.env.NEXT_PUBLIC_PROTOCOL || "https";
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT || "your-endpoint";
const PORT = process.env.NEXT_PUBLIC_PORT || "443";
const VALIDATE_API =
  "https://ecotrans-intranet-370980788525.europe-west1.run.app/validate";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Primera API: Autenticación
    const authUrl = `https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/authenticate`;
    const authResponse = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();

    if (!authData.secret || !authData.user) {
      return NextResponse.json(
        { error: "Respuesta de autenticación inválida" },
        { status: 500 }
      );
    }

    // Segunda API: Validación de usuario
    const validateUrl = `${VALIDATE_API}/${authData.user.name}`;
    const validateResponse = await fetch(validateUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!validateResponse.ok) {
      return NextResponse.json(
        { error: "Usuario no autorizado en el sistema" },
        { status: 403 }
      );
    }

    const userData = await validateResponse.json();

    if (!userData.id || !userData.username) {
      return NextResponse.json(
        { error: "Datos de usuario inválidos" },
        { status: 500 }
      );
    }

    // Configurar cookies seguras
    const cookieStore = await cookies();

    // Cookie para el token (HTTP-only, secure)
    cookieStore.set("auth_token", authData.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    // Cookie para datos de usuario (puede ser leída por el cliente)
    cookieStore.set(
      "user_data",
      JSON.stringify({
        id: userData.id,
        username: userData.username,
        fullName: userData.full_name,
        role: userData.role_name,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    // Cookie para el menú
    cookieStore.set("user_menu", JSON.stringify(userData.json_menu), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
