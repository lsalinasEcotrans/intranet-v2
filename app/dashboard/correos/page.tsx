import CorreosTable from "./components/correosTable";

export default function Page() {
  return (
    <div className="p-8">
      <div className="pb-5">
        <h2 className="text-3xl font-bold text-gray-900">Lista de correos</h2>
        <p className="text-gray-600">
          Lista de correos pendientes para ingreso a Autocab.
        </p>
      </div>

      <CorreosTable />
    </div>
  );
}
