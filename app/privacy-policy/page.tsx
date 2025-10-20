export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 md:px-20">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-6">
          Política de Privacidad – Intranet Ecotrans
        </h1>
        <p className="mb-4 font-semibold">Última actualización: Octubre 2025</p>
        <p className="mb-6">
          En <strong>Ecotrans</strong>, la protección y confidencialidad de la
          información son pilares fundamentales de nuestra gestión interna. Esta
          política describe cómo se maneja, almacena y protege la información
          contenida en la <strong>Intranet Ecotrans</strong> (en adelante, “la
          Plataforma”).
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Alcance</h2>
          <p>
            Esta política aplica a todos los usuarios con acceso autorizado a la
            Intranet Ecotrans, incluidos trabajadores, contratistas y
            colaboradores que, por sus funciones, utilizan la plataforma para
            acceder, registrar o gestionar información corporativa.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            2. Confidencialidad y uso de la información
          </h2>
          <p>
            Toda la información contenida dentro de la Intranet Ecotrans
            —incluyendo datos personales, documentos internos, registros
            operativos, financieros y técnicos— está protegida bajo:
          </p>
          <ul className="list-disc list-inside mb-3">
            <li>
              El <strong>Acuerdo de Confidencialidad</strong> firmado
              individualmente por cada trabajador o colaborador.
            </li>
            <li>
              Las <strong>normas legales vigentes en Chile</strong>,
              especialmente la{" "}
              <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong>{" "}
              y las disposiciones aplicables del{" "}
              <strong>Código del Trabajo</strong>.
            </li>
          </ul>
          <p>
            El acceso a la Intranet implica la{" "}
            <strong>aceptación expresa</strong> de mantener la confidencialidad
            de toda la información y de utilizarla únicamente con fines
            laborales y dentro del marco de las funciones asignadas.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            3. Protección de datos personales
          </h2>
          <p>
            Ecotrans garantiza que los datos personales de sus colaboradores se
            utilizan únicamente con fines administrativos, operativos o de
            cumplimiento legal. No se comparten con terceros, salvo obligación
            legal o autorización expresa del titular.
          </p>
          <p>
            Los usuarios pueden solicitar la revisión, rectificación o
            eliminación de sus datos personales conforme a la legislación
            chilena vigente.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            4. Seguridad de la información
          </h2>
          <p>
            La Intranet Ecotrans cuenta con medidas de seguridad técnicas y
            organizativas para proteger la información contra el acceso no
            autorizado, pérdida o uso indebido. Estas medidas incluyen, entre
            otras:
          </p>
          <ul className="list-disc list-inside mb-3">
            <li>Autenticación mediante credenciales personales.</li>
            <li>Control de acceso por roles y niveles jerárquicos.</li>
            <li>Registro de actividad y auditorías periódicas.</li>
            <li>Cifrado de las comunicaciones y almacenamiento seguro.</li>
          </ul>
          <p>
            El uso indebido, reproducción o divulgación no autorizada de la
            información contenida en la plataforma será considerada una{" "}
            <strong>falta grave</strong> y podrá derivar en{" "}
            <strong>acciones disciplinarias o legales</strong>.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            5. Responsabilidad del usuario
          </h2>
          <p>
            Cada usuario es responsable del uso adecuado de sus credenciales de
            acceso y de mantener la confidencialidad de la información a la que
            tenga acceso. El uso de la cuenta por parte de terceros está
            estrictamente prohibido.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            6. Modificaciones a esta política
          </h2>
          <p>
            Ecotrans podrá modificar esta Política de Privacidad en cualquier
            momento, comunicando los cambios a través de la Intranet o los
            canales oficiales internos. Las modificaciones entrarán en vigencia
            desde su publicación.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">7. Contacto</h2>
          <p>
            Para consultas relacionadas con esta política o el tratamiento de
            datos personales, puede comunicarse con el{" "}
            <strong>
              Departamento de Administración y Tecnología de Ecotrans
            </strong>{" "}
            a través de los canales internos establecidos.
          </p>
        </section>

        <p className="mt-6 text-sm text-gray-500">
          © Ecotrans 2025. Todos los derechos reservados. El uso de la Intranet
          Ecotrans implica la aceptación íntegra de esta Política de Privacidad
          y de las normas de confidencialidad vigentes.
        </p>
      </div>
    </div>
  );
}
