import {
  useEffect,
  useState,
  type SubmitEvent,
} from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  MapPin,
} from "lucide-react";

import api from "../services/api";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: string | number;
  current_stock: number;
  minimum_stock: number;
  location: string;
  created_at: string;
  updated_at: string;
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

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  minimum_stock: string;
  location: string;
}

interface ProductsResponse {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "",
  unit_price: "",
  current_stock: "",
  minimum_stock: "",
  location: "",
};

const inputClass =
  "h-10 w-full border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [movements, setMovements] = useState<Movement[]>(
    []
  );

  const [loadingMovements, setLoadingMovements] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const limit = 10;

  // -----------------------------------------
  // LOAD PRODUCTS
  // -----------------------------------------

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<
        string,
        string | number
      > = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category !== "ALL") {
        params.category = category;
      }

      if (stockFilter !== "ALL") {
        params.stock_status = stockFilter;
      }

      const response =
        await api.get<ProductsResponse>(
          "/products",
          { params }
        );

      console.log(
        "PRODUCTS API RESPONSE:",
        response.data
      );

      setProducts(
        response.data.products || []
      );

      setTotalPages(
        response.data.pagination?.totalPages || 1
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, category, stockFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts();
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // -----------------------------------------
  // FORM
  // -----------------------------------------

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category || "",
      unit_price: String(product.unit_price),
      current_stock: String(
        product.current_stock
      ),
      minimum_stock: String(
        product.minimum_stock
      ),
      location: product.location || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const updateField = (
    field: keyof ProductForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // -----------------------------------------
  // CREATE / UPDATE
  // -----------------------------------------

  const handleSubmit = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.sku.trim()) {
      setError("SKU is required.");
      return;
    }

    if (!form.unit_price) {
      setError("Unit price is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            category: form.category.trim(),
            unitPrice: Number(form.unit_price),
            minimumStock: Number(form.minimum_stock || 0),
            location: form.location.trim(),
        };

      if (editingProduct) {
            await api.put(
            `/products/${editingProduct.id}`,
            payload
        );
        } else {
            await api.post(
            "/products",
            payload
        );
        }

      closeModal();

      await loadProducts();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // PRODUCT DETAILS
  // -----------------------------------------

  const openDetails = async (
    product: Product
  ) => {
    setSelectedProduct(product);
    setMovements([]);
    setLoadingMovements(true);

    try {
      const response = await api.get<{
        product: Product;
        movements: Movement[];
      }>(
        `/products/${product.id}/stock-movements`
      );

      setMovements(
        response.data.movements || []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load stock movements."
      );
    } finally {
      setLoadingMovements(false);
    }
  };

  // -----------------------------------------
  // DELETE
  // -----------------------------------------

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);
      setError("");

      await api.delete(
        `/products/${deleteId}`
      );

      setDeleteId(null);

      if (
        selectedProduct?.id === deleteId
      ) {
        setSelectedProduct(null);
      }

      await loadProducts();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to delete product."
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // STOCK STATUS
  // -----------------------------------------

  const getStockStatus = (
    product: Product
  ) => {
    if (product.current_stock <= 0) {
      return {
        label: "Out of stock",
        className:
          "border-red-200 bg-red-50 text-red-700",
      };
    }

    if (
      product.current_stock <=
      product.minimum_stock
    ) {
      return {
        label: "Low stock",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "In stock",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            Inventory
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products, pricing and inventory levels.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Add product
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* FILTERS */}

      <div className="border border-gray-200 bg-white">

        <div className="flex flex-col gap-3 p-4 lg:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by product name or SKU..."
              className="h-10 w-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-gray-900 focus:bg-white"
            />

          </div>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="h-10 border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-900"
          >
            <option value="ALL">
              All categories
            </option>

            <option value="Electronics">
              Electronics
            </option>

            <option value="Furniture">
              Furniture
            </option>

            <option value="Stationery">
              Stationery
            </option>
          </select>

          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value)
            }
            className="h-10 border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-900"
          >
            <option value="ALL">
              All stock
            </option>

            <option value="IN_STOCK">
              In stock
            </option>

            <option value="LOW_STOCK">
              Low stock
            </option>

            <option value="OUT_OF_STOCK">
              Out of stock
            </option>
          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-hidden border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px]">

            <thead>

              <tr className="border-b border-gray-100 bg-gray-50">

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Product
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  SKU
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Category
                </th>

                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Price
                </th>

                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Stock
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="h-64"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Loading products...
                    </div>
                  </td>
                </tr>

              ) : products.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="h-64"
                  >
                    <div className="text-center">

                      <Package
                        size={28}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No products found
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Add your first product to get started.
                      </p>

                    </div>
                  </td>
                </tr>

              ) : (

                products.map((product) => {

                  const status =
                    getStockStatus(product);

                  return (
                    <tr
                      key={product.id}
                      className="group transition hover:bg-gray-50/60"
                    >

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            openDetails(product)
                          }
                          className="text-left"
                        >
                          <div className="font-medium text-gray-900 hover:text-gray-600">
                            {product.name}
                          </div>

                          <div className="mt-0.5 text-xs text-gray-400">
                            #{product.id}
                          </div>
                        </button>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.sku}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {product.category || "—"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-gray-800">
                        ₹
                        {Number(
                          product.unit_price
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-5 py-4 text-right">

                        <div className="text-sm font-medium text-gray-900">
                          {product.current_stock}
                        </div>

                        <div className="text-[11px] text-gray-400">
                          Min {product.minimum_stock}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex border px-2 py-1 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(product)
                            }
                            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteId(
                                product.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        {!loading &&
          products.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>

              <div className="flex gap-1">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </button>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </button>

              </div>

            </div>
          )}

      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-gray-950">
                  {editingProduct
                    ? "Edit product"
                    : "Add product"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Product and inventory information
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-900"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              <div className="grid gap-5 md:grid-cols-2">

                <Field label="Product name" required>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Laptop"
                    className={inputClass}
                  />
                </Field>

                <Field label="SKU" required>
                  <input
                    value={form.sku}
                    onChange={(event) =>
                      updateField(
                        "sku",
                        event.target.value
                      )
                    }
                    placeholder="LAP-001"
                    className={inputClass}
                  />
                </Field>

                <Field label="Category">
                  <input
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value
                      )
                    }
                    placeholder="Electronics"
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit price" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(event) =>
                      updateField(
                        "unit_price",
                        event.target.value
                      )
                    }
                    placeholder="55000"
                    className={inputClass}
                  />
                </Field>

                <Field label="Current stock">
                  <input
                    type="number"
                    min="0"
                    value={form.current_stock}
                    onChange={(event) =>
                      updateField(
                        "current_stock",
                        event.target.value
                      )
                    }
                    placeholder="20"
                    className={inputClass}
                  />
                </Field>

                <Field label="Minimum stock">
                  <input
                    type="number"
                    min="0"
                    value={form.minimum_stock}
                    onChange={(event) =>
                      updateField(
                        "minimum_stock",
                        event.target.value
                      )
                    }
                    placeholder="5"
                    className={inputClass}
                  />
                </Field>

                <Field label="Location">
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={form.location}
                      onChange={(event) =>
                        updateField(
                          "location",
                          event.target.value
                        )
                      }
                      placeholder="Warehouse A"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-10 min-w-32 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {editingProduct
                    ? "Save changes"
                    : "Create product"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* PRODUCT DETAILS DRAWER */}

      {selectedProduct && (
        <div className="fixed inset-0 z-40">

          <div
            className="absolute inset-0 bg-gray-950/30"
            onClick={() =>
              setSelectedProduct(null)
            }
          />

          <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Product details
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-950">
                  {selectedProduct.name}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(null)
                }
                className="text-gray-400 hover:text-gray-900"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-7 p-6">

              <div className="grid grid-cols-2 gap-4">

                <Info
                  label="SKU"
                  value={selectedProduct.sku}
                />

                <Info
                  label="Category"
                  value={
                    selectedProduct.category ||
                    "—"
                  }
                />

                <Info
                  label="Unit price"
                  value={`₹${Number(
                    selectedProduct.unit_price
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
                />

                <Info
                  label="Current stock"
                  value={String(
                    selectedProduct.current_stock
                  )}
                />

                <Info
                  label="Minimum stock"
                  value={String(
                    selectedProduct.minimum_stock
                  )}
                />

                <Info
                  label="Location"
                  value={
                    selectedProduct.location ||
                    "—"
                  }
                />

              </div>

              <div className="border-t border-gray-100 pt-6">

                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Stock movements
                </div>

                {loadingMovements ? (

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Loading movements...
                  </div>

                ) : movements.length === 0 ? (

                  <p className="text-sm text-gray-400">
                    No stock movements found.
                  </p>

                ) : (

                  <div className="space-y-3">

                    {movements.map(
                      (movement) => (
                        <div
                          key={movement.id}
                          className="border border-gray-100 p-3"
                        >

                          <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2">

                              {movement.movement_type ===
                              "IN" ? (
                                <ArrowDownToLine
                                  size={16}
                                  className="text-emerald-600"
                                />
                              ) : (
                                <ArrowUpFromLine
                                  size={16}
                                  className="text-red-600"
                                />
                              )}

                              <span className="text-sm font-medium text-gray-800">
                                {movement.movement_type}
                              </span>

                              <span className="text-sm text-gray-600">
                                {movement.quantity}
                              </span>

                            </div>

                            <span className="text-[11px] text-gray-400">
                              {new Date(
                                movement.created_at
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </span>

                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            {movement.reason}
                          </div>

                          <div className="mt-1 text-[11px] text-gray-400">
                            By{" "}
                            {
                              movement.created_by_name
                            }
                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

          </aside>

        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/40 p-4">

          <div className="w-full max-w-sm bg-white p-6 shadow-xl">

            <h2 className="text-lg font-semibold text-gray-950">
              Delete product?
            </h2>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                className="h-10 border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-10 bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div className="mt-1 text-sm text-gray-800">
        {value}
      </div>
    </div>
  );
}