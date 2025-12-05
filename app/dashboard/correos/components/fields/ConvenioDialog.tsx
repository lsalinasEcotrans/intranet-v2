"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface Customer {
  id: number;
  displayName: string;
  accountCode: string | null;
  suspended: boolean;
  active: boolean;
}

interface ConvenioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jwtToken?: string;
  onSelect: (accountCode: string | null, displayName: string) => void;
}

export default function ConvenioDialog({
  open,
  onOpenChange,
  jwtToken,
  onSelect,
}: ConvenioDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchCustomers() {
      setLoading(true);
      try {
        const res = await fetch("/api/ghost/customers");
        const data = await res.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error al cargar customers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [open]);

  const filtered = useMemo(() => {
    return customers
      .filter((c) => c.suspended === false) // <-- FILTRA SOLO ACTIVOS
      .filter((c) => c.active === true)
      .filter((c) => {
        const term = search.toLowerCase();
        const nameMatch = c.displayName.toLowerCase().includes(term);
        const codeMatch = (c.accountCode ?? "").toLowerCase().includes(term);
        return nameMatch || codeMatch;
      });
  }, [customers, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[50vw] max-w-[60vw] p-6 to-card bg-gradient-to-b from-green-100 to-40% [background-size:100%_101%] sm:max-w-sm dark:from-green-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Seleccionar Convenio
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Buscar convenio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />

          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-3 text-gray-600">
                  Cargando convenios...
                </span>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto overflow-x-auto border rounded-lg">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Account Code</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-gray-500 py-8"
                      >
                        No se encontraron convenios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.accountCode ?? "—"}
                        </TableCell>
                        <TableCell>{customer.displayName}</TableCell>

                        <TableCell>
                          <Button
                            className="h-7 px-2 py-1 text-xs"
                            onClick={() => {
                              onSelect(
                                customer.accountCode,
                                customer.displayName
                              );
                              onOpenChange(false);
                            }}
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
