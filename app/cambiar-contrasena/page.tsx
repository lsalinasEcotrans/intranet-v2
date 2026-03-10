import { Suspense } from "react"
import { ChangePasswordForm } from "@/components/change-password-form"

export const dynamic = "force-dynamic";

export default function CambiarContrasenaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  )
}