"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Pasajero {
  rut: string;
  nombre: string;
  accountcode: number;
}

export default function ListaPasajeros() {
  const searchParams = useSearchParams();
  const accountcode = searchParams.get("accountcode");

  const [data, setData] = useState<Pasajero[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    rut: "",
    nombre: "",
  });

  // ===============================
  // GET PASAJEROS
  // ===============================
  const fetchData = async () => {
    try {
      const res = await axios.get(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-pasajero/${accountcode}`,
      );
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (accountcode) fetchData();
  }, [accountcode]);

  // ===============================
  // CREATE
  // ===============================
  const handleCreate = async () => {
    try {
      await axios.post(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-pasajero/`,
        {
          rut: form.rut,
          nombre: form.nombre,
          accountcode: Number(accountcode),
        },
      );

      setOpen(false);
      setForm({ rut: "", nombre: "" });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // ===============================
  // DELETE
  // ===============================
  const handleDelete = async (rut: string) => {
    if (!confirm("¿Eliminar pasajero?")) return;

    try {
      await axios.delete(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-pasajero/${rut}`,
      );
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">
          Pasajeros - Empresa {accountcode}
        </h1>

        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pasajero
        </Button>
      </div>

      {/* TABLE */}
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((p) => (
              <TableRow key={p.rut}>
                <TableCell>{p.rut}</TableCell>
                <TableCell>{p.nombre}</TableCell>

                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(p.rut)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[400px] space-y-4">
            <h2 className="font-semibold">Nuevo Pasajero</h2>

            <input
              placeholder="RUT"
              className="w-full border p-2 rounded"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
            />

            <input
              placeholder="Nombre"
              className="w-full border p-2 rounded"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>

              <Button onClick={handleCreate}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
