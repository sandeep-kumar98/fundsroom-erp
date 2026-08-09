import { useEffect, useMemo, useState, type SubmitEvent } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Plus,
  X,
  Warehouse,
  ArrowDown,
} from "lucide-react";

import api from "../services/api";

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  location: string;
}

interface Movement {
  id: number;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_at: string;
  created_by_id: number;
  created_by_name: string;
}

interface MovementResponse {
  product: {
    id: number;
    name: string;
    sku: string;
  };
  movements: Movement[];
}

export default function StockMovements() {
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [movementType, setMovementType] =
    useState<"IN" | "OUT">("IN");

  const [filterType, setFilterType] =
    useState<"ALL" | "IN" | "OUT">("ALL");

  const [search, setSearch] = useState("");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [loadingMovements, setLoadingMovements] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showMovementForm, setShowMovementForm] =
    useState(false);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");

      const response = await api.get<{
        products: Product[];
      }>("/products", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const list =
        response.data.products || [];

      setProducts(list);

      if (
        list.length > 0 &&
        !selectedProductId
      ) {
        setSelectedProductId(
          String(list[0].id)
        );
      }
    } catch (err: any) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // =====================================================
  // LOAD MOVEMENTS
  // =====================================================

  const loadMovements = async (
    productId: string
  ) => {
    if (!productId) return;

    try {
      setLoadingMovements(true);
      setError("");

      const response =
        await api.get<MovementResponse>(
          `/products/${productId}/stock-movements`
        );

      setMovements(
        response.data.movements || []
      );

      const currentProduct =
        products.find(
          (item) =>
            item.id ===
            Number(productId)
        );

      if (currentProduct) {
        setProduct(currentProduct);
      }
    } catch (err: any) {
      console.error(
        "STOCK MOVEMENTS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          `Unable to load stock movements${
            err.response?.status
              ? ` (${err.response.status})`
              : ""
          }.`
      );
    } finally {
      setLoadingMovements(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProducts();
  }, []);

  // =====================================================
  // PRODUCT CHANGE
  // =====================================================

  useEffect(() => {
    if (!selectedProductId) return;

    const currentProduct =
      products.find(
        (item) =>
          item.id ===
          Number(selectedProductId)
      );

    if (currentProduct) {
      setProduct(currentProduct);
    }

    loadMovements(
      selectedProductId
    );
  }, [selectedProductId]);

  // =====================================================
  // ADD STOCK MOVEMENT
  // =====================================================

  const handleSubmit = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedProductId) {
      setError(
        "Please select a product."
      );
      return;
    }

    const qty = Number(quantity);

    if (
      !quantity ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      setError(
        "Quantity must be a positive whole number."
      );
      return;
    }

    if (!reason.trim()) {
      setError(
        "Reason is required."
      );
      return;
    }

    if (
      movementType === "OUT" &&
      product &&
      qty > product.current_stock
    ) {
      setError(
        `Insufficient stock. Available stock: ${product.current_stock}`
      );
      return;
    }

    try {
      setSaving(true);

      await api.post(
        `/products/${selectedProductId}/stock`,
        {
          quantity: qty,
          movementType,
          reason: reason.trim(),
        }
      );

      setQuantity("");
      setReason("");

      setSuccess(
        movementType === "IN"
          ? "Stock added successfully."
          : "Stock removed successfully."
      );

      setShowMovementForm(false);

      await loadProducts();

      await loadMovements(
        selectedProductId
      );
    } catch (err: any) {
      console.error(
        "UPDATE STOCK ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await loadProducts();

    if (selectedProductId) {
      await loadMovements(
        selectedProductId
      );
    }
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date: string) => {
    return new Date(
      date
    ).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // FILTERED MOVEMENTS
  // =====================================================

  const filteredMovements =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return movements.filter(
        (movement) => {
          const matchesType =
            filterType === "ALL" ||
            movement.movement_type ===
              filterType;

          const matchesSearch =
            !query ||
            movement.reason
              .toLowerCase()
              .includes(query) ||
            movement.created_by_name
              .toLowerCase()
              .includes(query);

          return (
            matchesType &&
            matchesSearch
          );
        }
      );
    }, [
      movements,
      filterType,
      search,
    ]);

  // =====================================================
  // MOVEMENT STATISTICS
  // =====================================================

  const totalIn = useMemo(
    () =>
      movements
        .filter(
          (movement) =>
            movement.movement_type ===
            "IN"
        )
        .reduce(
          (total, movement) =>
            total +
            Number(
              movement.quantity
            ),
          0
        ),
    [movements]
  );

  const totalOut = useMemo(
    () =>
      movements
        .filter(
          (movement) =>
            movement.movement_type ===
            "OUT"
        )
        .reduce(
          (total, movement) =>
            total +
            Number(
              movement.quantity
            ),
          0
        ),
    [movements]
  );

  const movementCount =
    movements.length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-7">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Inventory
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Stock Movements
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track inventory coming in and going out.
          </p>

        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-10 items-center justify-center gap-2 border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowMovementForm(true);
            }}
            disabled={!selectedProductId}
            className="inline-flex h-10 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
            Stock adjustment
          </button>

        </div>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-700"
          >
            <X size={15} />
          </button>

        </div>
      )}

      {success && (
        <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X size={15} />
          </button>

        </div>
      )}

      {/* PRODUCT SELECTOR */}

      <div className="border border-gray-200 bg-white p-5">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div className="w-full max-w-xl">

            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Product
            </label>

            {loadingProducts ? (

              <div className="flex h-10 items-center gap-2 text-sm text-gray-400">

                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Loading products...

              </div>

            ) : (

              <select
                value={
                  selectedProductId
                }
                onChange={(event) => {
                  setSelectedProductId(
                    event.target.value
                  );

                  setSearch("");
                  setFilterType("ALL");
                  setError("");
                  setSuccess("");
                }}
                className="h-11 w-full border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-gray-900"
              >

                <option value="">
                  Select a product
                </option>

                {products.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name} —{" "}
                      {item.sku}
                    </option>
                  )
                )}

              </select>

            )}

          </div>

          {product && (
            <div className="text-left md:text-right">

              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Location
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-800 md:justify-end">

                <Warehouse
                  size={14}
                  className="text-gray-400"
                />

                {product.location ||
                  "—"}

              </div>

            </div>
          )}

        </div>

      </div>

      {/* PRODUCT SUMMARY */}

      {product && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            label="Current stock"
            value={product.current_stock}
            suffix="units"
            icon={
              <Package size={17} />
            }
            alert={
              product.current_stock <=
              product.minimum_stock
            }
          />

          <SummaryCard
            label="Minimum stock"
            value={product.minimum_stock}
            suffix="units"
            icon={
              <ArrowDown size={17} />
            }
          />

          <SummaryCard
            label="Total received"
            value={totalIn}
            suffix="units"
            icon={
              <ArrowDownToLine
                size={17}
              />
            }
            positive
          />

          <SummaryCard
            label="Total issued"
            value={totalOut}
            suffix="units"
            icon={
              <ArrowUpFromLine
                size={17}
              />
            }
            negative
          />

        </div>
      )}

      {/* MOVEMENT HISTORY */}

      <section className="overflow-hidden border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-5 py-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-sm font-semibold text-gray-950">
                Movement history
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {product
                  ? `${product.name} · ${product.sku}`
                  : "Select a product to view activity"}
              </p>

            </div>

            {product && (
              <div className="text-xs text-gray-400">
                {movementCount}{" "}
                {movementCount === 1
                  ? "transaction"
                  : "transactions"}
              </div>
            )}

          </div>

          {product && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              <div className="relative flex-1">

                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search reason or user..."
                  className="h-10 w-full border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                />

              </div>

              <div className="flex border border-gray-200 bg-gray-50 p-1">

                <FilterButton
                  active={
                    filterType ===
                    "ALL"
                  }
                  onClick={() =>
                    setFilterType(
                      "ALL"
                    )
                  }
                >
                  All
                </FilterButton>

                <FilterButton
                  active={
                    filterType ===
                    "IN"
                  }
                  onClick={() =>
                    setFilterType(
                      "IN"
                    )
                  }
                >
                  Stock In
                </FilterButton>

                <FilterButton
                  active={
                    filterType ===
                    "OUT"
                  }
                  onClick={() =>
                    setFilterType(
                      "OUT"
                    )
                  }
                >
                  Stock Out
                </FilterButton>

              </div>

            </div>
          )}

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-212.5">

            <thead>

              <tr className="border-b border-gray-100 bg-gray-50">

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Movement
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Quantity
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Reason
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Created by
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Date
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loadingMovements ? (

                <tr>

                  <td
                    colSpan={5}
                    className="h-64"
                  >

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">

                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Loading movements...

                    </div>

                  </td>

                </tr>

              ) : !selectedProductId ? (

                <tr>

                  <td
                    colSpan={5}
                    className="h-64 text-center"
                  >

                    <div className="mx-auto flex h-10 w-10 items-center justify-center border border-gray-200 bg-gray-50 text-gray-400">

                      <Package
                        size={19}
                      />

                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      Select a product
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Choose a product above to view its stock history.
                    </p>

                  </td>

                </tr>

              ) : filteredMovements.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="h-64 text-center"
                  >

                    <div className="mx-auto flex h-10 w-10 items-center justify-center border border-gray-200 bg-gray-50 text-gray-400">

                      <Package
                        size={19}
                      />

                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      No movements found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing the filter or search.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredMovements.map(
                  (movement) => {

                    const isIn =
                      movement.movement_type ===
                      "IN";

                    return (
                      <tr
                        key={
                          movement.id
                        }
                        className="transition hover:bg-gray-50/60"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-9 w-9 items-center justify-center ${
                                isIn
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >

                              {isIn ? (
                                <ArrowDownToLine
                                  size={16}
                                />
                              ) : (
                                <ArrowUpFromLine
                                  size={16}
                                />
                              )}

                            </div>

                            <div>

                              <div
                                className={`text-sm font-semibold ${
                                  isIn
                                    ? "text-emerald-700"
                                    : "text-red-700"
                                }`}
                              >
                                {isIn
                                  ? "Stock In"
                                  : "Stock Out"}
                              </div>

                              <div className="mt-0.5 text-[10px] text-gray-400">
                                Movement #
                                {
                                  movement.id
                                }
                              </div>

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <span
                            className={`text-sm font-semibold ${
                              isIn
                                ? "text-emerald-700"
                                : "text-red-700"
                            }`}
                          >
                            {isIn
                              ? "+"
                              : "-"}
                            {
                              movement.quantity
                            }
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="max-w-sm text-sm text-gray-700">
                            {
                              movement.reason
                            }
                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <div className="text-sm text-gray-700">
                            {
                              movement.created_by_name
                            }
                          </div>

                          <div className="mt-0.5 text-[10px] text-gray-400">
                            User #
                            {
                              movement.created_by_id
                            }
                          </div>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <div className="text-xs font-medium text-gray-600">
                            {formatDate(
                              movement.created_at
                            )}
                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* STOCK ADJUSTMENT MODAL */}

      {showMovementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">

          <div className="w-full max-w-lg bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Inventory
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-950">
                  Stock adjustment
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMovementForm(
                    false
                  )
                }
                className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              <div className="border border-gray-200 bg-gray-50 p-4">

                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Product
                </div>

                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {product?.name}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  {product?.sku}
                  {" · "}
                  Current stock:{" "}
                  {product?.current_stock}
                </div>

              </div>

              <div>

                <label className="mb-2 block text-xs font-semibold text-gray-700">
                  Movement type
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setMovementType(
                        "IN"
                      )
                    }
                    className={`flex h-11 items-center justify-center gap-2 border text-sm font-medium transition ${
                      movementType ===
                      "IN"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >

                    <ArrowDownToLine
                      size={15}
                    />

                    Stock In

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMovementType(
                        "OUT"
                      )
                    }
                    className={`flex h-11 items-center justify-center gap-2 border text-sm font-medium transition ${
                      movementType ===
                      "OUT"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >

                    <ArrowUpFromLine
                      size={15}
                    />

                    Stock Out

                  </button>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-xs font-semibold text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  className="h-11 w-full border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900"
                />

                {movementType ===
                  "OUT" &&
                  product && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      Maximum available:{" "}
                      {
                        product.current_stock
                      }{" "}
                      units
                    </p>
                  )}

              </div>

              <div>

                <label className="mb-2 block text-xs font-semibold text-gray-700">
                  Reason
                </label>

                <input
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  placeholder={
                    movementType ===
                    "IN"
                      ? "Purchase received"
                      : "Damaged goods"
                  }
                  className="h-11 w-full border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-900"
                />

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowMovementForm(
                      false
                    )
                  }
                  className="h-10 border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedProductId
                  }
                  className={`flex h-10 min-w-36 items-center justify-center gap-2 px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    movementType ===
                    "IN"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >

                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {movementType ===
                  "IN"
                    ? "Add stock"
                    : "Remove stock"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  label,
  value,
  suffix,
  icon,
  alert = false,
  positive = false,
  negative = false,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  alert?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  let valueClass =
    "text-gray-950";

  if (alert) {
    valueClass =
      "text-red-600";
  } else if (positive) {
    valueClass =
      "text-emerald-700";
  } else if (negative) {
    valueClass =
      "text-red-700";
  }

  return (
    <div className="border border-gray-200 bg-white p-5">

      <div className="flex items-center justify-between">

        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          {label}
        </span>

        <span className="text-gray-400">
          {icon}
        </span>

      </div>

      <div
        className={`mt-4 text-2xl font-semibold tracking-tight ${valueClass}`}
      >
        {value}
        <span className="ml-1 text-xs font-normal text-gray-400">
          {suffix}
        </span>
      </div>

    </div>
  );
}

// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 text-xs font-medium transition ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}