import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";

import api from "../services/api";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: "Retail" | "Wholesale" | "Distributor";
  address?: string;
  status: "Lead" | "Active" | "Inactive";
  follow_up_date?: string;
  notes?: string;
  created_at: string;
}

interface CustomerResponse {
  customers: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CustomerForm {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: "Retail" | "Wholesale" | "Distributor";
  address: string;
  status: "Lead" | "Active" | "Inactive";
  follow_up_date: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  name: "",
  mobile: "",
  email: "",
  business_name: "",
  gst_number: "",
  customer_type: "Retail",
  address: "",
  status: "Lead",
  follow_up_date: "",
  notes: "",
};

const statusStyles: Record<Customer["status"], string> = {
  Lead: "bg-amber-50 text-amber-700 border-amber-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerForm>(
    emptyForm
  );

  const [deleteId, setDeleteId] = useState<number | null>(
    null
  );

  const limit = 10;

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      if (typeFilter !== "ALL") {
        params.customer_type = typeFilter;
      }

      const response = await api.get<CustomerResponse>(
  "/customers",
  {
    params,
  }
);

console.log("CUSTOMERS API RESPONSE:", response.data);

      setCustomers(response.data.customers || []);

      setTotalPages(
        response.data.pagination?.totalPages || 1
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadCustomers();
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      business_name: customer.business_name || "",
      gst_number: customer.gst_number || "",
      customer_type:
        customer.customer_type || "Retail",
      address: customer.address || "",
      status: customer.status || "Lead",
      follow_up_date:
        customer.follow_up_date
          ? customer.follow_up_date.slice(0, 10)
          : "",
      notes: customer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleChange = (
    field: keyof CustomerForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Mobile number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        business_name:
          form.business_name.trim() || null,
        gst_number:
          form.gst_number.trim() || null,
        customer_type: form.customer_type,
        address: form.address.trim() || null,
        status: form.status,
        follow_up_date:
          form.follow_up_date || null,
        notes: form.notes.trim() || null,
      };

      if (editingCustomer) {
        await api.put(
          `/customers/${editingCustomer.id}`,
          payload
        );
      } else {
        await api.post("/customers", payload);
      }

      closeModal();
      await loadCustomers();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);

      await api.delete(`/customers/${deleteId}`);

      setDeleteId(null);

      if (selectedCustomer?.id === deleteId) {
        setSelectedCustomer(null);
      }

      await loadCustomers();
    } catch (err: any) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to delete customer."
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleCustomers = useMemo(
    () => customers,
    [customers]
  );

  return (
    <div className="space-y-6">

      {/* Page header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            Sales
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer relationships and follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />

          Add customer
        </button>

      </div>

      {/* Error */}

      {error && (
        <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-800"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* Toolbar */}

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
              placeholder="Search customers..."
              className="h-10 w-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-10 border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-900"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="Lead">
              Lead
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className="h-10 border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-900"
          >
            <option value="ALL">
              All types
            </option>

            <option value="Retail">
              Retail
            </option>

            <option value="Wholesale">
              Wholesale
            </option>

            <option value="Distributor">
              Distributor
            </option>
          </select>

        </div>

      </div>

      {/* Table */}

      <div className="overflow-hidden border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] text-left">

            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">

                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Customer
                </th>

                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Business
                </th>

                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Type
                </th>

                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Contact
                </th>

                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
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
                    colSpan={6}
                    className="h-64"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : visibleCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-64"
                  >
                    <div className="text-center">

                      <UsersEmpty />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No customers found
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Try changing your search or add a new customer.
                      </p>

                    </div>
                  </td>
                </tr>
              ) : (
                visibleCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="group transition hover:bg-gray-50/60"
                  >

                    <td className="px-5 py-4">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCustomer(customer)
                        }
                        className="text-left"
                      >

                        <div className="font-medium text-gray-900 hover:text-gray-600">
                          {customer.name}
                        </div>

                        <div className="mt-0.5 text-xs text-gray-400">
                          #{String(customer.id).padStart(4, "0")}
                        </div>

                      </button>

                    </td>

                    <td className="px-5 py-4">

                      <div className="text-sm text-gray-700">
                        {customer.business_name || "—"}
                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <span className="text-sm text-gray-600">
                        {customer.customer_type}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="text-sm text-gray-700">
                        {customer.mobile}
                      </div>

                      {customer.email && (
                        <div className="mt-0.5 text-xs text-gray-400">
                          {customer.email}
                        </div>
                      )}

                    </td>

                    <td className="px-5 py-4">

                      <span
                        className={`inline-flex border px-2 py-1 text-[11px] font-medium ${
                          statusStyles[customer.status]
                        }`}
                      >
                        {customer.status}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(customer)
                          }
                          className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteId(customer.id)
                          }
                          className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}

        {!loading && visibleCustomers.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

            <p className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-1">

              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
                className="flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>

            </div>

          </div>
        )}

      </div>

      {/* Create / Edit modal */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  {editingCustomer
                    ? "Edit customer"
                    : "Add customer"}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Customer information and CRM details
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

                <FormField
                  label="Customer name"
                  required
                >
                  <input
                    value={form.name}
                    onChange={(event) =>
                      handleChange(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Amit Sharma"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Mobile number"
                  required
                >
                  <input
                    value={form.mobile}
                    onChange={(event) =>
                      handleChange(
                        "mobile",
                        event.target.value
                      )
                    }
                    placeholder="9876501234"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      handleChange(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="customer@example.com"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Business name">
                  <input
                    value={form.business_name}
                    onChange={(event) =>
                      handleChange(
                        "business_name",
                        event.target.value
                      )
                    }
                    placeholder="Amit Distributors"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="GST number">
                  <input
                    value={form.gst_number}
                    onChange={(event) =>
                      handleChange(
                        "gst_number",
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Customer type">
                  <select
                    value={form.customer_type}
                    onChange={(event) =>
                      handleChange(
                        "customer_type",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Retail">
                      Retail
                    </option>

                    <option value="Wholesale">
                      Wholesale
                    </option>

                    <option value="Distributor">
                      Distributor
                    </option>
                  </select>
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      handleChange(
                        "status",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Lead">
                      Lead
                    </option>

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </FormField>

                <FormField label="Follow-up date">
                  <input
                    type="date"
                    value={form.follow_up_date}
                    onChange={(event) =>
                      handleChange(
                        "follow_up_date",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </FormField>

              </div>

              <FormField label="Address">
                <textarea
                  value={form.address}
                  onChange={(event) =>
                    handleChange(
                      "address",
                      event.target.value
                    )
                  }
                  rows={2}
                  placeholder="Business address"
                  className={`${inputClass} resize-none py-2.5`}
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    handleChange(
                      "notes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Customer notes and follow-up information"
                  className={`${inputClass} resize-none py-2.5`}
                />
              </FormField>

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
                  className="flex h-10 min-w-28 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  {editingCustomer
                    ? "Save changes"
                    : "Create customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Customer detail drawer */}

      {selectedCustomer && (
        <div className="fixed inset-0 z-40">

          <div
            className="absolute inset-0 bg-gray-950/30"
            onClick={() =>
              setSelectedCustomer(null)
            }
          />

          <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Customer profile
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-950">
                  {selectedCustomer.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(null)
                }
                className="text-gray-400 hover:text-gray-900"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-7 p-6">

              <div className="flex items-center justify-between">

                <span
                  className={`inline-flex border px-2.5 py-1 text-xs font-medium ${
                    statusStyles[
                      selectedCustomer.status
                    ]
                  }`}
                >
                  {selectedCustomer.status}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    openEdit(selectedCustomer);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-950"
                >
                  <Pencil size={15} />
                  Edit
                </button>

              </div>

              <div className="space-y-4">

                <DetailRow
                  icon={<Building2 size={16} />}
                  label="Business"
                  value={
                    selectedCustomer.business_name ||
                    "—"
                  }
                />

                <DetailRow
                  icon={<Phone size={16} />}
                  label="Mobile"
                  value={selectedCustomer.mobile}
                />

                <DetailRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value={
                    selectedCustomer.email || "—"
                  }
                />

                <DetailRow
                  icon={<FileText size={16} />}
                  label="GST number"
                  value={
                    selectedCustomer.gst_number ||
                    "Not provided"
                  }
                />

                <DetailRow
                  icon={<MapPin size={16} />}
                  label="Address"
                  value={
                    selectedCustomer.address || "—"
                  }
                />

                <DetailRow
                  icon={<CalendarDays size={16} />}
                  label="Follow-up"
                  value={
                    selectedCustomer.follow_up_date
                      ? new Date(
                          selectedCustomer.follow_up_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "No follow-up scheduled"
                  }
                />

              </div>

              <div className="border-t border-gray-100 pt-6">

                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </div>

                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {selectedCustomer.notes ||
                    "No notes added."}
                </p>

              </div>

              <div className="border-t border-gray-100 pt-6">

                <div className="text-xs text-gray-400">
                  Customer type
                </div>

                <div className="mt-1 text-sm font-medium text-gray-900">
                  {selectedCustomer.customer_type}
                </div>

              </div>

            </div>

          </aside>

        </div>
      )}

      {/* Delete confirmation */}

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/40 p-4">

          <div className="w-full max-w-sm bg-white p-6 shadow-xl">

            <h2 className="text-lg font-semibold text-gray-950">
              Delete customer?
            </h2>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              This action cannot be undone. The customer
              record will be permanently removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setDeleteId(null)}
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

const inputClass =
  "h-10 w-full border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

function FormField({
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

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="mt-0.5 text-gray-400">
        {icon}
      </div>

      <div className="min-w-0">

        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          {label}
        </div>

        <div className="mt-1 break-words text-sm text-gray-800">
          {value}
        </div>

      </div>

    </div>
  );
}

function UsersEmpty() {
  return (
    <div className="mx-auto flex h-10 w-10 items-center justify-center border border-gray-200 text-gray-300">
      <UsersIcon />
    </div>
  );
}

function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}