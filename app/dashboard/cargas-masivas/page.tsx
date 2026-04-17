"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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

interface Empresa {
  accountcode: number;
  displayname: string;
  customerId: number;
  estado: string;
}

export default function EmpresasPage() {
  const router = useRouter();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Modal
  const [open, setOpen] = useState(false);

  // 🔹 Form
  const [form, setForm] = useState({
    accountcode: "",
    displayname: "",
    customerId: "",
  });

  // 🔹 Search
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // ===============================
  // GET EMPRESAS
  // ===============================
  const fetchEmpresas = async () => {
    try {
      const res = await axios.get(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-empresa/",
      );
      setEmpresas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // ===============================
  // SEARCH (DEBOUNCE)
  // ===============================
  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/ghost/customers/search?q=${search}`);
        setResults(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  // ===============================
  // CREATE
  // ===============================
  const handleCreate = async () => {
    if (!form.accountcode) {
      alert("Debe seleccionar una empresa");
      return;
    }

    try {
      await axios.post(
        "https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-empresa/",
        {
          accountcode: Number(form.accountcode),
          displayname: form.displayname,
          customerId: Number(form.customerId),
        },
      );

      handleClose();
      fetchEmpresas();
    } catch (error) {
      console.error(error);
    }
  };

  // ===============================
  // DELETE (soft)
  // ===============================
  const handleDelete = async (id: number) => {
    if (!confirm("¿Desactivar empresa?")) return;

    try {
      await axios.delete(
        `https://ecotrans-intranet-370980788525.europe-west1.run.app/cm-empresa/${id}`,
      );

      fetchEmpresas();
    } catch (error) {
      console.error(error);
    }
  };

  // ===============================
  // CLOSE MODAL
  // ===============================
  const handleClose = () => {
    setOpen(false);
    setForm({
      accountcode: "",
      displayname: "",
      customerId: "",
    });
    setSearch("");
    setResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">CM Empresas</h1>

        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* TABLE */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>AccountCode</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Cargando...</TableCell>
              </TableRow>
            ) : empresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>Sin datos</TableCell>
              </TableRow>
            ) : (
              empresas.map((e) => (
                <TableRow key={e.accountcode}>
                  <TableCell>{e.accountcode}</TableCell>
                  <TableCell>{e.displayname}</TableCell>

                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        e.estado === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {e.estado}
                    </span>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    {/* 🔥 NAVEGAR CON ACCOUNTCODE */}
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/cargas-masivas/modulo-carga?accountcode=${e.accountcode}`,
                        )
                      }
                    >
                      Gestionar
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(e.accountcode)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[450px] space-y-4">
            <h2 className="text-lg font-semibold">Nueva Empresa</h2>

            {/* 🔍 BUSCADOR PRINCIPAL */}
            <input
              placeholder="Buscar empresa (nombre o código)"
              className="w-full border p-2 rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* 🔽 RESULTADOS */}
            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setForm({
                        accountcode: r.accountCode,
                        displayname: r.displayName,
                        customerId: r.companyId || "",
                      });
                      setSearch("");
                      setResults([]);
                    }}
                  >
                    <div className="font-medium">{r.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.accountCode}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 🔒 SOLO LECTURA */}
            <input
              className="w-full border p-2 rounded bg-gray-100"
              value={form.accountcode}
              placeholder="AccountCode"
              readOnly
            />

            <input
              className="w-full border p-2 rounded bg-gray-100"
              value={form.displayname}
              placeholder="Nombre"
              readOnly
            />

            {/* ⚠️ customerId oculto */}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>

              <Button onClick={handleCreate} disabled={!form.accountcode}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
