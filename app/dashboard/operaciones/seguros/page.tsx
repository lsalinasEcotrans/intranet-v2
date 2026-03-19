"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileX,
} from "lucide-react";

interface Vehicle {
  id: number;
  callsign?: string;
  make?: string;
  model?: string;
  colour?: string;
  yearOfManufacture?: number;
  vehicleType?: string;
  size?: number;
  isActive?: boolean;
  isSuspended?: boolean;
  plateExpiryDate?: string;
  insuranceExpiryDate?: string;
  motExpiryDate?: string;
  roadTaxExpiryDate?: string;
}

export default function FlotaPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clientLastUpdate, setClientLastUpdate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedMissingData, setSelectedMissingData] = useState<string | null>(
    null,
  );

  const fetchVehicles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch("/api/ghost/vehicles");
      if (!response.ok) throw new Error("Error al obtener vehículos");
      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : [data]);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Polling automático cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVehicles(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchVehicles]);

  // Actualizar la hora del cliente cuando cambie lastUpdate
  useEffect(() => {
    setClientLastUpdate(new Date().toLocaleTimeString());
  }, [lastUpdate]);

  const handleRefresh = () => {
    fetchVehicles(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return dateString.split("T")[0];
  };

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return Infinity;
    const expiryDate = new Date(dateString.split("T")[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getVehicleStatus = (vehicle: Vehicle) => {
    const dates = [
      vehicle.plateExpiryDate,
      vehicle.insuranceExpiryDate,
      vehicle.motExpiryDate,
      vehicle.roadTaxExpiryDate,
    ];

    const daysUntilExpiry = dates
      .map((date) => getDaysUntilExpiry(date))
      .filter((days) => days !== Infinity);

    if (daysUntilExpiry.length === 0) return "unknown";

    const minDays = Math.min(...daysUntilExpiry);

    if (minDays <= 3) return "red";
    if (minDays <= 30) return "yellow";
    return "green";
  };

  const getDateColorClass = (dateString?: string) => {
    const days = getDaysUntilExpiry(dateString);
    if (days === Infinity) return "bg-gray-100 text-gray-700";
    if (days <= 3) return "bg-red-200 text-red-900";
    if (days <= 30) return "bg-yellow-200 text-yellow-900";
    return "bg-green-100 text-green-900";
  };

  const activeVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) => vehicle.isActive === true && vehicle.isSuspended === false,
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let filtered = activeVehicles.filter((vehicle) => {
      // Filtro de búsqueda por texto
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        vehicle.callsign?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower);

      // Filtro de callsign: ocultar del 600-699, 900-999 y 1000-9999
      const isInHiddenRanges = (callsign?: string) => {
        if (!callsign) return false;
        const num = parseInt(callsign, 10);
        if (isNaN(num)) return false;
        return (
          (num >= 600 && num <= 699) ||
          (num >= 900 && num <= 999) ||
          (num >= 1000 && num <= 9999)
        );
      };
      const matchesCallsign = !isInHiddenRanges(vehicle.callsign);

      return matchesSearch && matchesCallsign;
    });

    // Ordenar: primero por status (red arriba), luego por callsign numérico ascendente
    filtered.sort((a, b) => {
      const statusA = getVehicleStatus(a);
      const statusB = getVehicleStatus(b);
      const priorityA =
        statusA === "red"
          ? 0
          : statusA === "yellow"
            ? 1
            : statusA === "green"
              ? 2
              : 3;
      const priorityB =
        statusB === "red"
          ? 0
          : statusB === "yellow"
            ? 1
            : statusB === "green"
              ? 2
              : 3;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const aNum = parseInt(a.callsign || "0", 10);
      const bNum = parseInt(b.callsign || "0", 10);
      return aNum - bNum;
    });

    // Filtrar por status seleccionado
    if (selectedStatus) {
      filtered = filtered.filter(
        (vehicle) => getVehicleStatus(vehicle) === selectedStatus,
      );
    }

    // Filtrar por datos faltantes seleccionados
    if (selectedMissingData) {
      filtered = filtered.filter((vehicle) => {
        if (selectedMissingData === "plate") return !vehicle.plateExpiryDate;
        if (selectedMissingData === "insurance")
          return !vehicle.insuranceExpiryDate;
        if (selectedMissingData === "mot") return !vehicle.motExpiryDate;
        if (selectedMissingData === "tax") return !vehicle.roadTaxExpiryDate;
        return true;
      });
    }

    return filtered;
  }, [activeVehicles, searchTerm, selectedStatus, selectedMissingData]);

  const statusCounts = useMemo(() => {
    const counts = { green: 0, yellow: 0, red: 0, unknown: 0 };

    // Contar todos los vehículos visibles en la tabla (incluye búsqueda)
    filteredVehicles.forEach((vehicle) => {
      const status = getVehicleStatus(vehicle);
      counts[status as keyof typeof counts]++;
    });

    return counts;
  }, [filteredVehicles]);

  const missingDataCounts = useMemo(() => {
    const counts = {
      plate: 0,
      insurance: 0,
      mot: 0,
      tax: 0,
    };

    activeVehicles.forEach((vehicle) => {
      if (!vehicle.plateExpiryDate) counts.plate++;
      if (!vehicle.insuranceExpiryDate) counts.insurance++;
      if (!vehicle.motExpiryDate) counts.mot++;
      if (!vehicle.roadTaxExpiryDate) counts.tax++;
    });

    return counts;
  }, [activeVehicles]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Flota de Vehículos</h1>
        <p className="text-gray-600 mt-2">
          Total vehículos: {filteredVehicles.length}
        </p>
      </div>

      {/* Indicadores de vencimiento */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() =>
              setSelectedStatus(selectedStatus === "green" ? null : "green")
            }
            className={`p-4 rounded-lg cursor-pointer transition border-2 ${
              selectedStatus === "green"
                ? "border-green-600 bg-green-100"
                : "border-green-200 bg-green-50 hover:bg-green-100"
            }`}
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Vencimiento Seguro
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {statusCounts.green}
                </p>
                <p className="text-xs text-green-600">Más de 30 días</p>
              </div>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedStatus(selectedStatus === "yellow" ? null : "yellow")
            }
            className={`p-4 rounded-lg cursor-pointer transition border-2 ${
              selectedStatus === "yellow"
                ? "border-yellow-600 bg-yellow-100"
                : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Próximo Vencimiento
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {statusCounts.yellow}
                </p>
                <p className="text-xs text-yellow-600">4-30 días</p>
              </div>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedStatus(selectedStatus === "red" ? null : "red")
            }
            className={`p-4 rounded-lg cursor-pointer transition border-2 ${
              selectedStatus === "red"
                ? "border-red-600 bg-red-100"
                : "border-red-200 bg-red-50 hover:bg-red-100"
            }`}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Vencimiento Urgente
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {statusCounts.red}
                </p>
                <p className="text-xs text-red-600">3 días o menos</p>
              </div>
            </div>
          </div>

          <div
            onClick={() =>
              setSelectedStatus(selectedStatus === "unknown" ? null : "unknown")
            }
            className={`p-4 rounded-lg cursor-pointer transition border-2 ${
              selectedStatus === "unknown"
                ? "border-gray-600 bg-gray-100"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FileX className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Sin fechas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts.unknown}
                </p>
                <p className="text-xs text-gray-600">
                  Sin datos de vencimiento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Datos faltantes */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Datos Faltantes por Categoría
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              onClick={() =>
                setSelectedMissingData(
                  selectedMissingData === "plate" ? null : "plate",
                )
              }
              className={`p-3 rounded cursor-pointer transition border-2 ${
                selectedMissingData === "plate"
                  ? "border-blue-600 bg-blue-200"
                  : "border-blue-200 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileX className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-800">
                    Sin Permiso Circulación
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {missingDataCounts.plate}
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() =>
                setSelectedMissingData(
                  selectedMissingData === "insurance" ? null : "insurance",
                )
              }
              className={`p-3 rounded cursor-pointer transition border-2 ${
                selectedMissingData === "insurance"
                  ? "border-orange-600 bg-orange-200"
                  : "border-orange-200 bg-orange-50 hover:bg-orange-100"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileX className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-orange-800">
                    Sin Seguro
                  </p>
                  <p className="text-lg font-bold text-orange-900">
                    {missingDataCounts.insurance}
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() =>
                setSelectedMissingData(
                  selectedMissingData === "mot" ? null : "mot",
                )
              }
              className={`p-3 rounded cursor-pointer transition border-2 ${
                selectedMissingData === "mot"
                  ? "border-purple-600 bg-purple-200"
                  : "border-purple-200 bg-purple-50 hover:bg-purple-100"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileX className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs font-medium text-purple-800">
                    Sin Revisión Técnica
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {missingDataCounts.mot}
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() =>
                setSelectedMissingData(
                  selectedMissingData === "tax" ? null : "tax",
                )
              }
              className={`p-3 rounded cursor-pointer transition border-2 ${
                selectedMissingData === "tax"
                  ? "border-indigo-600 bg-indigo-200"
                  : "border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileX className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-medium text-indigo-800">
                    Sin SOAP
                  </p>
                  <p className="text-lg font-bold text-indigo-900">
                    {missingDataCounts.tax}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Última actualización: {clientLastUpdate || "Cargando..."}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron vehículos
          </div>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold">
                    Callsign
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Marca</th>
                  <th className="px-4 py-3 text-left font-semibold">Modelo</th>
                  <th className="px-4 py-3 text-left font-semibold">Color</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Permiso circulación
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Seguro Asiento
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Revisión Técnica
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">SOAP</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className={`border-b hover:bg-gray-50 ${getVehicleStatus(vehicle) === "red" ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {vehicle.callsign}
                    </td>
                    <td className="px-4 py-3">{vehicle.make}</td>
                    <td className="px-4 py-3">{vehicle.model}</td>
                    <td className="px-4 py-3">{vehicle.colour}</td>
                    <td
                      className={`px-4 py-3 rounded ${getDateColorClass(vehicle.plateExpiryDate)}`}
                    >
                      {getDaysUntilExpiry(vehicle.plateExpiryDate) <= 3 ? (
                        <Badge variant="destructive">
                          {formatDate(vehicle.plateExpiryDate)}
                        </Badge>
                      ) : (
                        formatDate(vehicle.plateExpiryDate)
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 rounded ${getDateColorClass(vehicle.insuranceExpiryDate)}`}
                    >
                      {getDaysUntilExpiry(vehicle.insuranceExpiryDate) <= 3 ? (
                        <Badge variant="destructive">
                          {formatDate(vehicle.insuranceExpiryDate)}
                        </Badge>
                      ) : (
                        formatDate(vehicle.insuranceExpiryDate)
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 rounded ${getDateColorClass(vehicle.motExpiryDate)}`}
                    >
                      {getDaysUntilExpiry(vehicle.motExpiryDate) <= 3 ? (
                        <Badge variant="destructive">
                          {formatDate(vehicle.motExpiryDate)}
                        </Badge>
                      ) : (
                        formatDate(vehicle.motExpiryDate)
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 rounded ${getDateColorClass(vehicle.roadTaxExpiryDate)}`}
                    >
                      {getDaysUntilExpiry(vehicle.roadTaxExpiryDate) <= 3 ? (
                        <Badge variant="destructive">
                          {formatDate(vehicle.roadTaxExpiryDate)}
                        </Badge>
                      ) : (
                        formatDate(vehicle.roadTaxExpiryDate)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
