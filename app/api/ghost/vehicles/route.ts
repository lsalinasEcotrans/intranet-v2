import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

    const response = await fetch(
      'https://ghost-main-static-b7ec98c880a54ad5a4782393902a32a2.ghostapi.app:29003/api/v1/vehicles',
      {
        method: 'GET',
        headers: {
            "Authentication-Token": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch drivers' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
