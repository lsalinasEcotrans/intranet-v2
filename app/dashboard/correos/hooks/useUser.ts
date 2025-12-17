import { useState, useEffect } from "react";

interface UserData {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    if (cookies.user_data) {
      try {
        const data = JSON.parse(decodeURIComponent(cookies.user_data));
        setUser(data);
      } catch (e) {
        console.error("Error al leer cookie de usuario:", e);
      }
    }
  }, []);

  return user;
}
