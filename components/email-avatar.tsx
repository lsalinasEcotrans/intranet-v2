"use client";

interface EmailAvatarProps {
  email: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Extrae las iniciales del email (antes del @)
 * Ejemplo: lsalinas@ecorreo.cl → LS
 */
function getInitials(email: string): string {
  const username = email.split("@")[0];
  const initials = username
    .replace(/[._-]/g, " ")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "?";
}

/**
 * Genera un color consistente basado en el email
 * El mismo email siempre genera el mismo color
 */
function getColorFromEmail(email: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];
  const hash = email.charCodeAt(0) + email.charCodeAt(email.length - 1);
  return colors[hash % colors.length];
}

export function EmailAvatar({
  email,
  size = "md",
  className = "",
}: EmailAvatarProps) {
  const initials = getInitials(email);
  const bgColor = getColorFromEmail(email);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-semibold",
    md: "w-10 h-10 text-sm font-semibold",
    lg: "w-12 h-12 text-base font-semibold",
    xl: "w-16 h-16 text-lg font-bold",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white ${bgColor} ${sizeClasses[size]} ${className}`}
      title={email}
    >
      {initials}
    </div>
  );
}
