import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Challans from "./pages/Challans";
import StockMovements from "./pages/StockMovements";

/* =====================================================
   TYPES
===================================================== */

type Role =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

/* =====================================================
   AUTH HELPERS
===================================================== */

function getUserRole(): Role | null {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(
      storedUser
    );

    const role =
      String(
        user.role || ""
      ).toUpperCase();

    if (
      role === "ADMIN" ||
      role === "SALES" ||
      role === "WAREHOUSE" ||
      role === "ACCOUNTS"
    ) {
      return role;
    }

    return null;
  } catch {
    return null;
  }
}

/* =====================================================
   PROTECTED LAYOUT
===================================================== */

function ProtectedLayout() {
  const token =
    localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <AppLayout />;
}

/* =====================================================
   ROLE PROTECTED ROUTE
===================================================== */

function RoleRoute({
  allowedRoles,
}: {
  allowedRoles: Role[];
}) {
  const token =
    localStorage.getItem("token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const role =
    getUserRole();

  if (!role) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

/* =====================================================
   APP
===================================================== */

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* =================================================
            PROTECTED APPLICATION
        ================================================= */}

        <Route
          element={<ProtectedLayout />}
        >

          {/* ===============================================
              DASHBOARD
          =============================================== */}

          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* ===============================================
              CUSTOMERS
              ADMIN + SALES
          =============================================== */}

          <Route element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
                "SALES",
              ]}
            />
          }>

            <Route
              path="/customers"
              element={<Customers />}
            />

          </Route>

          {/* ===============================================
              PRODUCTS
              ALL AUTHENTICATED ROLES
          =============================================== */}

          <Route element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
                "SALES",
                "WAREHOUSE",
                "ACCOUNTS",
              ]}
            />
          }>

            <Route
              path="/products"
              element={<Products />}
            />

          </Route>

          {/* ===============================================
              STOCK MOVEMENTS
              ADMIN + WAREHOUSE + ACCOUNTS
          =============================================== */}

          <Route element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
                "WAREHOUSE",
                "ACCOUNTS",
              ]}
            />
          }>

            <Route
              path="/stock"
              element={
                <StockMovements />
              }
            />

          </Route>

          {/* ===============================================
              CHALLANS
              ALL AUTHENTICATED ROLES
          =============================================== */}

          <Route element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
                "SALES",
                "WAREHOUSE",
                "ACCOUNTS",
              ]}
            />
          }>

            <Route
              path="/challans"
              element={
                <Challans />
              }
            />

          </Route>

          {/* ===============================================
              SETTINGS
              ADMIN ONLY
          =============================================== */}

          <Route element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
              ]}
            />
          }>

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Route>

        </Route>

        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}