import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Package,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Warehouse,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import api from "../services/api";

interface Customer {
  id: number;
  name: string;
  business_name?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
}

interface Challan {
  id: number;
  challan_number: string;
  customer_name: string;
  business_name?: string;
  total_quantity: number;
  status: string;
  created_at: string;
}

interface CustomerResponse {
  customers: Customer[];
}

interface ProductResponse {
  products: Product[];
}

interface ChallanResponse {
  challans: Challan[];
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        customersResponse,
        productsResponse,
        challansResponse,
      ] = await Promise.all([
        api.get<CustomerResponse>("/customers", {
          params: {
            page: 1,
            limit: 100,
          },
        }),

        api.get<ProductResponse>("/products", {
          params: {
            page: 1,
            limit: 100,
          },
        }),

        api.get<ChallanResponse>("/challans", {
          params: {
            page: 1,
            limit: 10,
          },
        }),
      ]);

      setCustomers(
        customersResponse.data.customers || []
      );

      setProducts(
        productsResponse.data.products || []
      );

      setChallans(
        challansResponse.data.challans || []
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // ------------------------------------------------
  // CALCULATIONS
  // ------------------------------------------------

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.current_stock <=
          product.minimum_stock
      ),
    [products]
  );

  const totalUnits = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total +
          Number(product.current_stock),
        0
      ),
    [products]
  );

  const healthyProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.current_stock >
          product.minimum_stock
      ).length,
    [products]
  );

  const confirmedChallans = useMemo(
    () =>
      challans.filter(
        (challan) =>
          challan.status === "CONFIRMED"
      ).length,
    [challans]
  );

  const draftChallans = useMemo(
    () =>
      challans.filter(
        (challan) =>
          challan.status === "DRAFT"
      ).length,
    [challans]
  );

  const cancelledChallans = useMemo(
    () =>
      challans.filter(
        (challan) =>
          challan.status === "CANCELLED" ||
          challan.status === "CANCELED"
      ).length,
    [challans]
  );

  const totalDispatchQuantity = useMemo(
    () =>
      challans
        .filter(
          (challan) =>
            challan.status === "CONFIRMED"
        )
        .reduce(
          (total, challan) =>
            total +
            Number(challan.total_quantity),
          0
        ),
    [challans]
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">

        <div className="flex items-center gap-2 text-sm text-gray-400">

          <Loader2
            size={17}
            className="animate-spin"
          />

          Loading dashboard...

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ============================================
          HEADER
      ============================================ */}

      <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Overview
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            A clear view of your business operations.
          </p>

        </div>

        <div className="text-right">

          <div className="text-xs font-medium text-gray-900">
            {today}
          </div>

          <div className="mt-1 text-[11px] text-gray-400">
            FundsRoom ERP
          </div>

        </div>

      </div>

      {/* ============================================
          PRIMARY METRICS
      ============================================ */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          icon={<Users size={17} />}
          label="Customers"
          value={customers.length}
          description="Registered customers"
        />

        <MetricCard
          icon={<Package size={17} />}
          label="Products"
          value={products.length}
          description="Products in inventory"
        />

        <MetricCard
          icon={<Warehouse size={17} />}
          label="Stock Units"
          value={totalUnits}
          description="Current available units"
        />

        <MetricCard
          icon={<AlertTriangle size={17} />}
          label="Low Stock"
          value={lowStockProducts.length}
          description={
            lowStockProducts.length > 0
              ? "Requires attention"
              : "Inventory is healthy"
          }
          alert={
            lowStockProducts.length > 0
          }
        />

      </div>

      {/* ============================================
          MAIN CONTENT
      ============================================ */}

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">

        {/* RECENT CHALLANS */}

        <section className="overflow-hidden border border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div>

              <h2 className="text-sm font-semibold text-gray-950">
                Recent Challans
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Latest sales activity
              </p>

            </div>

            <a
              href="/challans"
              className="flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-950"
            >
              View all
              <ArrowUpRight size={14} />
            </a>

          </div>

          {challans.length === 0 ? (

            <EmptyState
              icon={<FileText size={22} />}
              title="No challans yet"
              description="Sales activity will appear here."
            />

          ) : (

            <div className="divide-y divide-gray-100">

              {challans
                .slice(0, 6)
                .map((challan) => (

                  <a
                    href="/challans"
                    key={challan.id}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-gray-50"
                  >

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <span className="text-sm font-semibold text-gray-900">
                          {
                            challan.challan_number
                          }
                        </span>

                        <StatusBadge
                          status={
                            challan.status
                          }
                        />

                      </div>

                      <div className="mt-1 truncate text-xs text-gray-400">

                        {challan.customer_name}

                        {challan.business_name
                          ? ` · ${challan.business_name}`
                          : ""}

                      </div>

                    </div>

                    <div className="ml-5 shrink-0 text-right">

                      <div className="text-sm font-medium text-gray-800">
                        {
                          challan.total_quantity
                        }{" "}
                        units
                      </div>

                      <div className="mt-1 text-[10px] text-gray-400">
                        {formatDate(
                          challan.created_at
                        )}{" "}
                        ·{" "}
                        {formatTime(
                          challan.created_at
                        )}
                      </div>

                    </div>

                  </a>

                ))}

            </div>

          )}

        </section>

        {/* INVENTORY ALERTS */}

        <section className="overflow-hidden border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-5 py-4">

            <h2 className="text-sm font-semibold text-gray-950">
              Inventory Alerts
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Products requiring attention
            </p>

          </div>

          {lowStockProducts.length === 0 ? (

            <EmptyState
              icon={
                <CheckCircle2 size={22} />
              }
              title="Inventory looks good"
              description="No products are below their minimum stock."
              success
            />

          ) : (

            <div className="divide-y divide-gray-100">

              {lowStockProducts
                .slice(0, 6)
                .map((product) => (

                  <a
                    href="/products"
                    key={product.id}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-gray-50"
                  >

                    <div>

                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        {product.sku}
                      </div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm font-semibold text-red-600">
                        {
                          product.current_stock
                        }
                      </div>

                      <div className="mt-1 text-[10px] text-gray-400">
                        Min{" "}
                        {
                          product.minimum_stock
                        }
                      </div>

                    </div>

                  </a>

                ))}

            </div>

          )}

        </section>

      </div>

      {/* ============================================
          OPERATION SUMMARY
      ============================================ */}

      <section className="border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-5 py-4">

          <div>

            <h2 className="text-sm font-semibold text-gray-950">
              Operations
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Current challan activity
            </p>

          </div>

        </div>

        <div className="grid divide-y divide-gray-100 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">

          <OperationItem
            icon={<CheckCircle2 size={17} />}
            label="Confirmed"
            value={confirmedChallans}
            description="Confirmed challans"
          />

          <OperationItem
            icon={<Clock3 size={17} />}
            label="Draft"
            value={draftChallans}
            description="Awaiting confirmation"
          />

          <OperationItem
            icon={<XCircle size={17} />}
            label="Cancelled"
            value={cancelledChallans}
            description="Cancelled challans"
          />

          <OperationItem
            icon={<Package size={17} />}
            label="Dispatch"
            value={totalDispatchQuantity}
            description="Units dispatched"
          />

        </div>

      </section>

      {/* ============================================
          INVENTORY OVERVIEW
      ============================================ */}

      <section className="border border-gray-200 bg-white">

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

          <div>

            <h2 className="text-sm font-semibold text-gray-950">
              Inventory Overview
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Current stock position
            </p>

          </div>

          <a
            href="/products"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-950"
          >
            Manage inventory
            <ArrowUpRight size={14} />
          </a>

        </div>

        <div className="grid divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">

          <InventoryMetric
            label="Total units"
            value={totalUnits}
            description="Across all products"
          />

          <InventoryMetric
            label="Healthy products"
            value={healthyProducts}
            description="Above minimum stock"
          />

          <InventoryMetric
            label="Needs attention"
            value={lowStockProducts.length}
            description="At or below minimum"
            alert={
              lowStockProducts.length > 0
            }
          />

        </div>

      </section>

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}

      <section>

        <div className="mb-3">

          <h2 className="text-sm font-semibold text-gray-950">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Common operations
          </p>

        </div>

        <div className="grid gap-3 sm:grid-cols-3">

          <QuickAction
            href="/challans"
            icon={<FileText size={17} />}
            title="Create Challan"
            description="Create a new sales challan"
          />

          <QuickAction
            href="/products"
            icon={<Package size={17} />}
            title="Manage Products"
            description="View inventory and stock"
          />

          <QuickAction
            href="/customers"
            icon={<Users size={17} />}
            title="Manage Customers"
            description="View your customer directory"
          />

        </div>

      </section>

    </div>
  );
}

// =====================================================
// METRIC CARD
// =====================================================

function MetricCard({
  icon,
  label,
  value,
  description,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  alert?: boolean;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5 transition hover:border-gray-300">

      <div className="flex items-start justify-between">

        <div className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-500">
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-gray-300"
        />

      </div>

      <div className="mt-6">

        <div
          className={`text-3xl font-semibold tracking-tight ${
            alert && value > 0
              ? "text-red-600"
              : "text-gray-950"
          }`}
        >
          {value}
        </div>

        <div className="mt-2 text-sm font-medium text-gray-900">
          {label}
        </div>

        <div className="mt-1 text-xs text-gray-400">
          {description}
        </div>

      </div>

    </div>
  );
}

// =====================================================
// OPERATION ITEM
// =====================================================

function OperationItem({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="p-5">

      <div className="flex items-center gap-2 text-gray-400">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <div className="mt-4 text-2xl font-semibold tracking-tight text-gray-950">
        {value}
      </div>

      <div className="mt-1 text-xs text-gray-400">
        {description}
      </div>

    </div>
  );
}

// =====================================================
// INVENTORY METRIC
// =====================================================

function InventoryMetric({
  label,
  value,
  description,
  alert = false,
}: {
  label: string;
  value: number;
  description: string;
  alert?: boolean;
}) {
  return (
    <div className="p-5">

      <div className="text-xs text-gray-400">
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          alert && value > 0
            ? "text-red-600"
            : "text-gray-950"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-xs text-gray-400">
        {description}
      </div>

    </div>
  );
}

// =====================================================
// QUICK ACTION
// =====================================================

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:bg-gray-50"
    >

      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gray-200 text-gray-500 transition group-hover:text-gray-900">
        {icon}
      </div>

      <div className="min-w-0">

        <div className="text-sm font-medium text-gray-900">
          {title}
        </div>

        <div className="mt-1 truncate text-xs text-gray-400">
          {description}
        </div>

      </div>

      <ArrowUpRight
        size={15}
        className="ml-auto shrink-0 text-gray-300 transition group-hover:text-gray-700"
      />

    </a>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({
  icon,
  title,
  description,
  success = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  success?: boolean;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center px-5 text-center">

      <div
        className={`flex h-10 w-10 items-center justify-center border ${
          success
            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
            : "border-gray-200 bg-gray-50 text-gray-400"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 text-sm font-medium text-gray-700">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  let className =
    "border-gray-200 bg-gray-50 text-gray-600";

  if (normalized === "CONFIRMED") {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "DRAFT") {
    className =
      "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "PENDING") {
    className =
      "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  ) {
    className =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${className}`}
    >
      {status}
    </span>
  );
}