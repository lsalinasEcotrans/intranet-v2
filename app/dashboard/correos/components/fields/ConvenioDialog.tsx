"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, SearchCheck, Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/* =======================
   Interfaces
======================= */

interface Customer {
  id: number; // 👈 customerId
  displayName: string;
  accountCode: string | null;
  suspended: boolean;
  active: boolean;
}

interface ConvenioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jwtToken?: string;
  onSelect: (
    customerId: number,
    accountCode: string | null,
    displayName: string
  ) => void;
}

/* =======================
   Component
======================= */

export default function ConvenioDialog({
  open,
  onOpenChange,
  jwtToken,
  onSelect,
}: ConvenioDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* =======================
     Fetch customers
  ======================= */

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

  /* =======================
     Filtrado
  ======================= */

  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return customers
      .filter((c) => c.suspended === false)
      .filter((c) => c.active === true)
      .filter((c) => {
        const nameMatch = c.displayName.toLowerCase().includes(term);
        const codeMatch = (c.accountCode ?? "").toLowerCase().includes(term);
        return nameMatch || codeMatch;
      });
  }, [customers, search]);

  /* =======================
     Render
  ======================= */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[60vw] max-w-[70vw] p-6 to-card bg-gradient-to-b from-green-100 to-40% [background-size:100%_101%] sm:max-w-sm dark:from-green-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Seleccionar Convenio
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Buscador */}
          <InputGroup className="bg-white">
            <InputGroupInput
              placeholder="Buscar convenio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-3 text-gray-600">Cargando convenios...</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto overflow-x-auto border rounded-lg">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-gray-200">
                    {/* <TableHead>Customer ID</TableHead> */}
                    <TableHead>Account Code</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500 py-8"
                      >
                        No se encontraron convenios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((customer) => (
                      <TableRow key={customer.id}>
                        {/* <TableCell className="font-mono text-xs">
                          {customer.id}
                        </TableCell> */}

                        <TableCell className="font-medium">
                          {customer.accountCode ?? "—"}
                        </TableCell>

                        <TableCell>{customer.displayName}</TableCell>

                        <TableCell className="text-center">
                          <Button
                            size="icon-lg"
                            onClick={() => {
                              onSelect(
                                customer.id,
                                customer.accountCode,
                                customer.displayName
                              );
                              onOpenChange(false);
                            }}
                          >
                            <SearchCheck />
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
