import { useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  Search,
  X,
  Loader2,
  FileText,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Printer,
  Check,
  Ban,
} from "lucide-react";

import api from "../services/api";

interface Customer {
  id: number;
  name: string;
  mobile?: string;
  email?: string;
  business_name?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: string | number;
  current_stock: number;
  minimum_stock?: number;
}

interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name: string;
  business_name?: string;
  total_quantity: number;
  status: string;
  created_by: number;
  created_at: string;
}

interface ChallanItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string | number;
  quantity: number;
}

interface ChallanDetails {
  challan: Challan & {
    customer_mobile?: string;
    customer_email?: string;
    gst_number?: string | null;
  };
  items: ChallanItem[];
}

interface CustomerResponse {
  customers: Customer[];
  pagination?: {
    total: number;
    totalPages: number;
  };
}

interface ProductResponse {
  products: Product[];
  pagination?: {
    total: number;
    totalPages: number;
  };
}

interface ChallanResponse {
  challans: Challan[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateItem {
  product_id: number;
  quantity: number;
}

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] =
    useState(1);

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedChallan, setSelectedChallan] =
    useState<ChallanDetails | null>(null);

  const [customerId, setCustomerId] =
    useState("");

  const [items, setItems] = useState<CreateItem[]>([
    {
      product_id: 0,
      quantity: 1,
    },
  ]);

  const limit = 10;

  // =====================================================
  // LOAD CHALLANS
  // =====================================================

  const loadChallans = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ChallanResponse>(
          "/challans",
          {
            params: {
              page,
              limit,
              search:
                search.trim() || undefined,
            },
          }
        );

      setChallans(
        response.data.challans || []
      );

      setTotalPages(
        response.data.pagination
          ?.totalPages || 1
      );
    } catch (err: any) {
      console.error(
        "LOAD CHALLANS ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load challans."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CUSTOMERS + PRODUCTS
  // =====================================================

  const loadFormData = async () => {
    try {
      setLoadingFormData(true);
      setError("");

      const [
        customersResponse,
        productsResponse,
      ] = await Promise.all([
        api.get<CustomerResponse>(
          "/customers",
          {
            params: {
              page: 1,
              limit: 100,
            },
          }
        ),

        api.get<ProductResponse>(
          "/products",
          {
            params: {
              page: 1,
              limit: 100,
            },
          }
        ),
      ]);

      setCustomers(
        customersResponse.data.customers ||
          []
      );

      setProducts(
        productsResponse.data.products || []
      );
    } catch (err: any) {
      console.error(
        "LOAD FORM DATA ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load customers and products."
      );
    } finally {
      setLoadingFormData(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadChallans();
  }, [page]);

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        loadChallans();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // CREATE MODAL
  // =====================================================

  const openCreate = async () => {
    setCustomerId("");

    setItems([
      {
        product_id: 0,
        quantity: 1,
      },
    ]);

    setError("");
    setSuccess("");

    setShowCreate(true);

    await loadFormData();
  };

  const closeCreate = () => {
    if (saving) return;

    setShowCreate(false);
  };

  // =====================================================
  // ITEM MANAGEMENT
  // =====================================================

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        product_id: 0,
        quantity: 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;

    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const updateItem = (
    index: number,
    field: keyof CreateItem,
    value: number
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // =====================================================
  // CREATE CHALLAN
  // =====================================================

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!customerId) {
      setError(
        "Please select a customer."
      );
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.product_id > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );

    if (validItems.length === 0) {
      setError(
        "Add at least one product with a valid quantity."
      );
      return;
    }

    // Duplicate products
    const productIds =
      validItems.map(
        (item) => item.product_id
      );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      setError(
        "A product can only be added once."
      );
      return;
    }

    // Stock validation
    for (const item of validItems) {
      const product = products.find(
        (product) =>
          product.id === item.product_id
      );

      if (!product) {
        setError(
          "One of the selected products is invalid."
        );
        return;
      }

      if (
        item.quantity >
        product.current_stock
      ) {
        setError(
          `${product.name} has only ${product.current_stock} units available.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        customerId: Number(customerId),

        items: validItems.map((item) => ({
          productId: Number(
            item.product_id
          ),
          quantity: Number(
            item.quantity
          ),
        })),
      };

      console.log(
        "CREATE CHALLAN PAYLOAD:",
        payload
      );

      await api.post(
        "/challans",
        payload
      );

      setShowCreate(false);

      setCustomerId("");

      setItems([
        {
          product_id: 0,
          quantity: 1,
        },
      ]);

      setSuccess(
        "Challan created successfully."
      );

      await loadChallans();
    } catch (err: any) {
      console.error(
        "CREATE CHALLAN ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to create challan."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const viewDetails = async (
    challanId: number
  ) => {
    try {
      setLoadingDetails(true);
      setError("");

      const response =
        await api.get<ChallanDetails>(
          `/challans/${challanId}`
        );

      setSelectedChallan(
        response.data
      );
    } catch (err: any) {
      console.error(
        "VIEW CHALLAN ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load challan details."
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // =====================================================
  // CONFIRM
  // =====================================================

  const confirmChallan = async (
    challanId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to confirm this challan?"
      );

    if (!confirmed) return;

    try {
      setActionLoading(challanId);
      setError("");
      setSuccess("");

      await api.post(
        `/challans/${challanId}/confirm`
      );

      setSuccess(
        "Challan confirmed successfully."
      );

      await loadChallans();

      if (
        selectedChallan?.challan.id ===
        challanId
      ) {
        await viewDetails(challanId);
      }
    } catch (err: any) {
      console.error(
        "CONFIRM CHALLAN ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to confirm challan."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const cancelChallan = async (
    challanId: number
  ) => {
    const cancelled =
      window.confirm(
        "Are you sure you want to cancel this challan?"
      );

    if (!cancelled) return;

    try {
      setActionLoading(challanId);
      setError("");
      setSuccess("");

      await api.post(
        `/challans/${challanId}/cancel`
      );

      setSuccess(
        "Challan cancelled successfully."
      );

      await loadChallans();

      if (
        selectedChallan?.challan.id ===
        challanId
      ) {
        await viewDetails(challanId);
      }
    } catch (err: any) {
      console.error(
        "CANCEL CHALLAN ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to cancel challan."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // PRINT CHALLAN
  // =====================================================

  const printChallan = () => {
    if (!selectedChallan) return;

    const {
      challan,
      items,
    } = selectedChallan;

    const totalQuantity =
      items.reduce(
        (total, item) =>
          total +
          Number(item.quantity),
        0
      );

    const totalAmount =
      items.reduce(
        (total, item) =>
          total +
          Number(item.unit_price) *
            Number(item.quantity),
        0
      );

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );

    if (!printWindow) {
      setError(
        "Please allow pop-ups to print the challan."
      );
      return;
    }

    const customerAddress =
      challan.business_name || "";

    const rows = items
      .map(
        (item, index) => {
          const amount =
            Number(item.unit_price) *
            Number(item.quantity);

          return `
            <tr>
              <td class="center">
                ${index + 1}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    item.product_name
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(item.sku)}
              </td>

              <td class="right">
                ₹${Number(
                  item.unit_price
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>

              <td class="center">
                ${item.quantity}
              </td>

              <td class="right">
                ₹${amount.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </td>
            </tr>
          `;
        }
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />

        <title>
          ${escapeHtml(
            challan.challan_number
          )} - Delivery Challan
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #111827;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 12px;
          }

          .page {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 22px;
            border-bottom: 2px solid #111827;
          }

          .brand {
            font-size: 27px;
            font-weight: 800;
            letter-spacing: -1px;
          }

          .brand-sub {
            margin-top: 5px;
            color: #6b7280;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .document {
            text-align: right;
          }

          .document-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }

          .document-number {
            margin-top: 6px;
            color: #4b5563;
            font-size: 12px;
          }

          .meta-grid {
            display: grid;
            grid-template-columns:
              1fr
              1fr
              1fr;
            gap: 20px;
            margin-top: 28px;
          }

          .meta-box {
            min-height: 80px;
          }

          .label {
            margin-bottom: 8px;
            color: #6b7280;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
          }

          .value {
            color: #111827;
            font-size: 12px;
            line-height: 1.7;
          }

          .status {
            display: inline-block;
            padding: 5px 9px;
            border: 1px solid #bbf7d0;
            background: #f0fdf4;
            color: #15803d;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          table {
            width: 100%;
            margin-top: 25px;
            border-collapse: collapse;
          }

          th {
            padding: 10px 8px;
            border-top: 1.5px solid #111827;
            border-bottom: 1px solid #d1d5db;
            color: #4b5563;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-align: left;
            text-transform: uppercase;
          }

          td {
            padding: 12px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
          }

          .right {
            text-align: right;
          }

          .center {
            text-align: center;
          }

          .summary {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }

          .summary-box {
            width: 285px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
            color: #4b5563;
          }

          .summary-total {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            padding-top: 12px;
            border-top: 2px solid #111827;
            color: #111827;
            font-size: 14px;
            font-weight: 800;
          }

          .terms {
            margin-top: 35px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            background: #fafafa;
          }

          .terms-title {
            margin-bottom: 6px;
            color: #374151;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .terms-text {
            color: #6b7280;
            font-size: 9px;
            line-height: 1.6;
          }

          .signatures {
            display: grid;
            grid-template-columns:
              1fr
              1fr;
            gap: 80px;
            margin-top: 90px;
          }

          .signature {
            padding-top: 45px;
            border-top: 1px solid #9ca3af;
            color: #6b7280;
            font-size: 9px;
            text-align: center;
          }

          .footer {
            margin-top: 35px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 8px;
            text-align: center;
          }

          @media print {

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

          }

        </style>

      </head>

      <body>

        <div class="page">

          <div class="top">

            <div>

              <div class="brand">
                FundsRoom
              </div>

              <div class="brand-sub">
                ERP Platform
              </div>

            </div>

            <div class="document">

              <div class="document-title">
                DELIVERY CHALLAN
              </div>

              <div class="document-number">
                ${escapeHtml(
                  challan.challan_number
                )}
              </div>

              <div class="document-number">
                ${formatDate(
                  challan.created_at
                )}
              </div>

            </div>

          </div>

          <div class="meta-grid">

            <div class="meta-box">

              <div class="label">
                Bill To / Customer
              </div>

              <div class="value">

                <strong>
                  ${escapeHtml(
                    challan.customer_name
                  )}
                </strong>

                ${
                  customerAddress
                    ? `<br>${escapeHtml(
                        customerAddress
                      )}`
                    : ""
                }

                ${
                  challan.customer_mobile
                    ? `<br>${escapeHtml(
                        challan.customer_mobile
                      )}`
                    : ""
                }

              </div>

            </div>

            <div class="meta-box">

              <div class="label">
                Contact
              </div>

              <div class="value">

                ${
                  challan.customer_email
                    ? escapeHtml(
                        challan.customer_email
                      )
                    : "—"
                }

                ${
                  challan.gst_number
                    ? `<br>GST: ${escapeHtml(
                        challan.gst_number
                      )}`
                    : ""
                }

              </div>

            </div>

            <div class="meta-box">

              <div class="label">
                Status
              </div>

              <div class="status">
                ${escapeHtml(
                  challan.status
                )}
              </div>

            </div>

          </div>

          <table>

            <thead>

              <tr>

                <th class="center">
                  #
                </th>

                <th>
                  Product
                </th>

                <th>
                  SKU
                </th>

                <th class="right">
                  Unit Price
                </th>

                <th class="center">
                  Qty
                </th>

                <th class="right">
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              ${rows}

            </tbody>

          </table>

          <div class="summary">

            <div class="summary-box">

              <div class="summary-row">

                <span>
                  Total Quantity
                </span>

                <strong>
                  ${totalQuantity}
                </strong>

              </div>

              <div class="summary-total">

                <span>
                  Total Value
                </span>

                <span>
                  ₹${totalAmount.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

            </div>

          </div>

          <div class="terms">

            <div class="terms-title">
              Note
            </div>

            <div class="terms-text">
              This delivery challan is generated
              through FundsRoom ERP. Please verify
              the products and quantities received
              before signing.
            </div>

          </div>

          <div class="signatures">

            <div class="signature">
              Customer / Receiver Signature
            </div>

            <div class="signature">
              Authorized Signature
            </div>

          </div>

          <div class="footer">
            FundsRoom ERP · Delivery Challan ·
            ${escapeHtml(
              challan.challan_number
            )}
          </div>

        </div>

        <script>

          window.onload = function () {

            setTimeout(function () {
              window.print();
            }, 250);

            window.onafterprint = function () {
              window.close();
            };

          };

        </script>

      </body>

      </html>
    `);

    printWindow.document.close();
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date: string) => {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // TOTAL QUANTITY
  // =====================================================

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total +
        (item.product_id > 0
          ? Number(item.quantity) || 0
          : 0),
      0
    );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Sales
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Challans
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage delivery challans and sales dispatch.
          </p>

        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Create challan
        </button>

      </div>

      {/* ALERT */}

      {error && (
        <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
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
          >
            <X size={15} />
          </button>

        </div>
      )}

      {/* SEARCH */}

      <div className="border border-gray-200 bg-white p-4">

        <div className="relative max-w-xl">

          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search challan number or customer..."
            className="h-10 w-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
          />

        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-hidden border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px]">

            <thead>

              <tr className="border-b border-gray-100 bg-gray-50">

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Challan
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Customer
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Quantity
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Status
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Created
                </th>

                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Action
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
                        size={16}
                        className="animate-spin"
                      />

                      Loading challans...

                    </div>

                  </td>

                </tr>

              ) : challans.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="h-64 text-center"
                  >

                    <FileText
                      size={28}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      No challans found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Create your first delivery challan.
                    </p>

                  </td>

                </tr>

              ) : (

                challans.map(
                  (challan) => {

                    const busy =
                      actionLoading ===
                      challan.id;

                    return (
                      <tr
                        key={challan.id}
                        className="transition hover:bg-gray-50/60"
                      >

                        {/* CHALLAN */}

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              viewDetails(
                                challan.id
                              )
                            }
                            className="text-left"
                          >

                            <div className="text-sm font-semibold text-gray-900 hover:text-gray-600">
                              {
                                challan.challan_number
                              }
                            </div>

                            <div className="mt-1 text-[11px] text-gray-400">
                              #{challan.id}
                            </div>

                          </button>

                        </td>

                        {/* CUSTOMER */}

                        <td className="px-5 py-4">

                          <div className="text-sm font-medium text-gray-800">
                            {
                              challan.customer_name
                            }
                          </div>

                          {challan.business_name && (
                            <div className="mt-1 text-xs text-gray-400">
                              {
                                challan.business_name
                              }
                            </div>
                          )}

                        </td>

                        {/* QUANTITY */}

                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-800">
                          {
                            challan.total_quantity
                          }
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={
                              challan.status
                            }
                          />

                        </td>

                        {/* CREATED */}

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDate(
                            challan.created_at
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                viewDetails(
                                  challan.id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                              title="View"
                            >
                              <Eye size={15} />
                            </button>

                            {challan.status ===
                              "DRAFT" && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    confirmChallan(
                                      challan.id
                                    )
                                  }
                                  className="flex h-8 items-center gap-1.5 border border-emerald-200 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                >

                                  {busy ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check
                                      size={13}
                                    />
                                  )}

                                  Confirm

                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    cancelChallan(
                                      challan.id
                                    )
                                  }
                                  className="flex h-8 items-center gap-1.5 border border-red-200 px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                >

                                  <Ban
                                    size={13}
                                  />

                                  Cancel

                                </button>
                              </>
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

        {/* PAGINATION */}

        {!loading &&
          challans.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">

              <span className="text-xs text-gray-400">
                Page {page} of{" "}
                {totalPages}
              </span>

              <div className="flex gap-1">

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(
                        1,
                        value - 1
                      )
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

      {/* =================================================
          CREATE MODAL
      ================================================= */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-lg font-semibold text-gray-950">
                    Create challan
                  </h2>

                  <span className="border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-blue-700">
                    Draft
                  </span>

                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Stock is reduced only when the challan is confirmed.
                </p>

              </div>

              <button
                type="button"
                onClick={closeCreate}
                className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              >
                <X size={18} />
              </button>

            </div>

            {loadingFormData ? (

              <div className="flex h-72 items-center justify-center gap-2 text-sm text-gray-400">

                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Loading customers and products...

              </div>

            ) : (

              <form
                onSubmit={handleCreate}
                className="space-y-7 p-6"
              >

                {/* CUSTOMER */}

                <div>

                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Customer
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={customerId}
                    onChange={(event) =>
                      setCustomerId(
                        event.target.value
                      )
                    }
                    className="h-11 w-full border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-gray-900"
                  >

                    <option value="">
                      Select customer
                    </option>

                    {customers.map(
                      (customer) => (
                        <option
                          key={customer.id}
                          value={
                            customer.id
                          }
                        >
                          {customer.name}
                          {customer.business_name
                            ? ` — ${customer.business_name}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* PRODUCTS */}

                <div>

                  <div className="mb-3 flex items-end justify-between">

                    <div>

                      <h3 className="text-sm font-semibold text-gray-900">
                        Products
                      </h3>

                      <p className="mt-1 text-xs text-gray-400">
                        Add products being dispatched.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex h-9 items-center gap-2 border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Plus size={14} />
                      Add product
                    </button>

                  </div>

                  <div className="space-y-3">

                    {items.map(
                      (
                        item,
                        index
                      ) => {

                        const selected =
                          products.find(
                            (
                              product
                            ) =>
                              product.id ===
                              item.product_id
                          );

                        const quantityError =
                          selected &&
                          item.quantity >
                            selected.current_stock;

                        return (
                          <div
                            key={index}
                            className="border border-gray-200 bg-gray-50/50 p-4"
                          >

                            <div className="grid grid-cols-[1fr_130px_40px] gap-3">

                              {/* PRODUCT */}

                              <div>

                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  Product
                                </label>

                                <select
                                  value={
                                    item.product_id ||
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateItem(
                                      index,
                                      "product_id",
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="h-10 w-full border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-900"
                                >

                                  <option value="">
                                    Select product
                                  </option>

                                  {products.map(
                                    (
                                      product
                                    ) => (
                                      <option
                                        key={
                                          product.id
                                        }
                                        value={
                                          product.id
                                        }
                                      >
                                        {
                                          product.name
                                        }{" "}
                                        —{" "}
                                        {
                                          product.sku
                                        }{" "}
                                        · Stock{" "}
                                        {
                                          product.current_stock
                                        }
                                      </option>
                                    )
                                  )}

                                </select>

                                {selected && (
                                  <div
                                    className={`mt-1.5 text-[11px] ${
                                      quantityError
                                        ? "text-red-600"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    Available stock:{" "}
                                    {
                                      selected.current_stock
                                    }
                                  </div>
                                )}

                              </div>

                              {/* QUANTITY */}

                              <div>

                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  Quantity
                                </label>

                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className={`h-10 w-full border bg-white px-3 text-sm outline-none ${
                                    quantityError
                                      ? "border-red-300"
                                      : "border-gray-200 focus:border-gray-900"
                                  }`}
                                />

                              </div>

                              {/* REMOVE */}

                              <div className="flex items-end">

                                <button
                                  type="button"
                                  disabled={
                                    items.length ===
                                    1
                                  }
                                  onClick={() =>
                                    removeItem(
                                      index
                                    )
                                  }
                                  className="flex h-10 w-10 items-center justify-center text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-20"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>

                              </div>

                            </div>

                            {quantityError && (
                              <div className="mt-2 text-[11px] text-red-600">
                                Requested quantity exceeds available stock.
                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* SUMMARY */}

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">

                  <div>

                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Total quantity
                    </div>

                    <div className="mt-1 text-xl font-semibold text-gray-950">
                      {totalQuantity}
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        units
                      </span>
                    </div>

                  </div>

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={closeCreate}
                      className="h-10 border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex h-10 min-w-40 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
                    >

                      {saving && (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      )}

                      Create draft

                    </button>

                  </div>

                </div>

              </form>
            )}

          </div>

        </div>
      )}

      {/* =================================================
          DETAILS DRAWER
      ================================================= */}

      {selectedChallan && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-gray-950/30"
            onClick={() =>
              setSelectedChallan(null)
            }
          />

          <aside className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">

            {/* DRAWER HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Delivery challan
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <h2 className="text-lg font-semibold text-gray-950">
                    {
                      selectedChallan
                        .challan
                        .challan_number
                    }
                  </h2>

                  <StatusBadge
                    status={
                      selectedChallan
                        .challan
                        .status
                    }
                  />

                </div>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={printChallan}
                  className="flex h-9 items-center gap-2 border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <Printer size={15} />
                  Print
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedChallan(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            <div className="space-y-7 p-6">

              {/* CUSTOMER */}

              <section>

                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Customer
                </div>

                <div className="border border-gray-200 p-5">

                  <div className="text-base font-semibold text-gray-950">
                    {
                      selectedChallan
                        .challan
                        .customer_name
                    }
                  </div>

                  {selectedChallan
                    .challan
                    .business_name && (
                    <div className="mt-1 text-sm text-gray-500">
                      {
                        selectedChallan
                          .challan
                          .business_name
                      }
                    </div>
                  )}

                  <div className="mt-4 space-y-1 text-xs text-gray-400">

                    {selectedChallan
                      .challan
                      .customer_mobile && (
                      <div>
                        {
                          selectedChallan
                            .challan
                            .customer_mobile
                        }
                      </div>
                    )}

                    {selectedChallan
                      .challan
                      .customer_email && (
                      <div>
                        {
                          selectedChallan
                            .challan
                            .customer_email
                        }
                      </div>
                    )}

                    {selectedChallan
                      .challan
                      .gst_number && (
                      <div>
                        GST:{" "}
                        {
                          selectedChallan
                            .challan
                            .gst_number
                        }
                      </div>
                    )}

                  </div>

                </div>

              </section>

              {/* SUMMARY */}

              <section className="grid grid-cols-2 border-y border-gray-100">

                <div className="px-1 py-5">

                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Created
                  </div>

                  <div className="mt-2 text-sm font-medium text-gray-800">
                    {formatDate(
                      selectedChallan
                        .challan
                        .created_at
                    )}
                  </div>

                </div>

                <div className="border-l border-gray-100 px-5 py-5">

                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Total quantity
                  </div>

                  <div className="mt-2 text-lg font-semibold text-gray-950">
                    {
                      selectedChallan
                        .challan
                        .total_quantity
                    }
                  </div>

                </div>

              </section>

              {/* ACTIONS */}

              {selectedChallan.challan.status ===
                "DRAFT" && (
                <section className="flex gap-3">

                  <button
                    type="button"
                    disabled={
                      actionLoading ===
                      selectedChallan
                        .challan
                        .id
                    }
                    onClick={() =>
                      confirmChallan(
                        selectedChallan
                          .challan
                          .id
                      )
                    }
                    className="flex h-10 flex-1 items-center justify-center gap-2 bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >

                    {actionLoading ===
                    selectedChallan
                      .challan
                      .id ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Check
                        size={15}
                      />
                    )}

                    Confirm challan

                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading ===
                      selectedChallan
                        .challan
                        .id
                    }
                    onClick={() =>
                      cancelChallan(
                        selectedChallan
                          .challan
                          .id
                      )
                    }
                    className="flex h-10 flex-1 items-center justify-center gap-2 border border-red-200 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Ban size={15} />
                    Cancel
                  </button>

                </section>
              )}

              {/* ITEMS */}

              <section>

                <div className="mb-3 flex items-end justify-between">

                  <div>

                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                      Items
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      Products included in this challan
                    </div>

                  </div>

                  <div className="text-sm font-semibold text-gray-900">
                    {
                      selectedChallan
                        .items
                        .length
                    }{" "}
                    items
                  </div>

                </div>

                <div className="overflow-hidden border border-gray-200">

                  <div className="grid grid-cols-[1fr_70px_100px] border-b border-gray-100 bg-gray-50 px-4 py-3">

                    <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Product
                    </span>

                    <span className="text-right text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Qty
                    </span>

                    <span className="text-right text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      Amount
                    </span>

                  </div>

                  {selectedChallan.items.map(
                    (item) => {

                      const amount =
                        Number(
                          item.unit_price
                        ) *
                        Number(
                          item.quantity
                        );

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_70px_100px] items-center border-b border-gray-100 px-4 py-4 last:border-0"
                        >

                          <div>

                            <div className="text-sm font-medium text-gray-900">
                              {
                                item.product_name
                              }
                            </div>

                            <div className="mt-1 text-[11px] text-gray-400">
                              {item.sku}
                              {" · "}
                              ₹
                              {Number(
                                item.unit_price
                              ).toLocaleString(
                                "en-IN"
                              )}{" "}
                              / unit
                            </div>

                          </div>

                          <div className="text-right text-sm font-semibold text-gray-800">
                            {item.quantity}
                          </div>

                          <div className="text-right text-sm font-medium text-gray-800">
                            ₹
                            {amount.toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </div>

                        </div>
                      );
                    }
                  )}

                  <div className="grid grid-cols-[1fr_70px_100px] border-t border-gray-200 bg-gray-50 px-4 py-4">

                    <div className="text-xs font-semibold text-gray-700">
                      Total
                    </div>

                    <div className="text-right text-sm font-semibold text-gray-900">
                      {
                        selectedChallan
                          .challan
                          .total_quantity
                      }
                    </div>

                    <div className="text-right text-sm font-semibold text-gray-950">

                      ₹
                      {selectedChallan.items
                        .reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            Number(
                              item.unit_price
                            ) *
                              Number(
                                item.quantity
                              ),
                          0
                        )
                        .toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}

                    </div>

                  </div>

                </div>

              </section>

            </div>

          </aside>

        </div>
      )}

      {/* DETAILS LOADING */}

      {loadingDetails && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-lg">

          <Loader2
            size={15}
            className="animate-spin"
          />

          Loading challan...

        </div>
      )}

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

  if (normalized === "DRAFT") {
    className =
      "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "CONFIRMED") {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
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

// =====================================================
// ESCAPE PRINT HTML
// =====================================================

function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}