import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Warehouse,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

type Role =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

interface User {
  name?: string;
  role?: string;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

interface NavigationGroup {
  section: string;
  items: NavigationItem[];
}

/* =====================================================
   NAVIGATION
===================================================== */

const navigation: NavigationGroup[] = [
  {
    section: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        roles: [
          "ADMIN",
          "SALES",
          "WAREHOUSE",
          "ACCOUNTS",
        ],
      },
    ],
  },

  {
    section: "Sales",
    items: [
      {
        name: "Customers",
        path: "/customers",
        icon: Users,
        roles: [
          "ADMIN",
          "SALES",
        ],
      },

      {
        name: "Challans",
        path: "/challans",
        icon: FileText,
        roles: [
          "ADMIN",
          "SALES",
          "WAREHOUSE",
          "ACCOUNTS",
        ],
      },
    ],
  },

  {
    section: "Inventory",
    items: [
      {
        name: "Products",
        path: "/products",
        icon: Package,
        roles: [
          "ADMIN",
          "SALES",
          "WAREHOUSE",
          "ACCOUNTS",
        ],
      },

      {
        name: "Stock Movements",
        path: "/stock",
        icon: Warehouse,
        roles: [
          "ADMIN",
          "WAREHOUSE",
          "ACCOUNTS",
        ],
      },
    ],
  },
];

/* =====================================================
   SIDEBAR
===================================================== */

export default function Sidebar() {
  const navigate = useNavigate();

  /* ---------------------------------------------------
     USER
  --------------------------------------------------- */

  let user: User = {};

  try {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch {
    user = {};
  }

  const name =
    user.name || "System Admin";

  const roleValue =
    String(
      user.role || "ADMIN"
    ).toUpperCase();

  const role: Role =
    roleValue === "SALES" ||
    roleValue === "WAREHOUSE" ||
    roleValue === "ACCOUNTS"
      ? roleValue
      : "ADMIN";

  /* ---------------------------------------------------
     INITIALS
  --------------------------------------------------- */

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map(
        (part) => part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";

  /* ---------------------------------------------------
     LOGOUT
  --------------------------------------------------- */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  /* ---------------------------------------------------
     VISIBLE NAVIGATION
  --------------------------------------------------- */

  const visibleGroups =
    navigation
      .map((group) => ({
        section: group.section,

        items: group.items.filter(
          (item) =>
            item.roles.includes(role)
        ),
      }))
      .filter(
        (group) =>
          group.items.length > 0
      );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">

      {/* =================================================
          BRAND
      ================================================= */}

      <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-6">

        <div>
          <div className="text-xl font-semibold tracking-tight text-gray-950">
            FundsRoom
          </div>

          <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
            ERP Platform
          </div>
        </div>

      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="flex-1 overflow-y-auto px-3 py-6">

        {visibleGroups.map(
          (group) => (
            <div
              key={group.section}
              className="mb-7"
            >

              {/* Section */}

              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {group.section}
              </div>

              {/* Items */}

              <div className="space-y-1">

                {group.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={
                          item.path === "/"
                        }
                        className={({
                          isActive,
                        }) =>
                          [
                            "flex",
                            "w-full",
                            "items-center",
                            "gap-3",
                            "rounded-lg",
                            "px-3",
                            "py-2.5",
                            "text-sm",
                            "font-medium",
                            "transition-colors",

                            // IMPORTANT:
                            // active item is light,
                            // not dark.
                            isActive
                                ? "bg-gray-200 text-gray-950"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                          ].join(" ")
                        }
                      >

                        <Icon
                          className="shrink-0"
                          size={18}
                          strokeWidth={1.8}
                        />

                        <span className="block">
                          {item.name}
                        </span>

                      </NavLink>
                    );
                  }
                )}

              </div>

            </div>
          )
        )}

        {/* =================================================
            SYSTEM
        ================================================= */}

        {role === "ADMIN" && (
          <div className="mb-7">

            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              System
            </div>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [
                  "flex",
                  "w-full",
                  "items-center",
                  "gap-3",
                  "rounded-lg",
                  "px-3",
                  "py-2.5",
                  "text-sm",
                  "font-medium",
                  "transition-colors",

                  isActive
                    ? "bg-gray-100 text-gray-950"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
                ].join(" ")
              }
            >

              <Settings
                className="shrink-0"
                size={18}
                strokeWidth={1.8}
              />

              <span className="block">
                Settings
              </span>

            </NavLink>

          </div>
        )}

      </nav>

      {/* =================================================
          USER SECTION
      ================================================= */}

      <div className="shrink-0 border-t border-gray-100 p-3">

        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">

          {/* Avatar */}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
            {initials}
          </div>

          {/* User */}

          <div className="min-w-0 flex-1">

            <div className="truncate text-sm font-medium text-gray-900">
              {name}
            </div>

            <div className="text-xs text-gray-500">
              {formatRole(role)}
            </div>

          </div>

        </div>

        {/* Logout */}

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >

          <LogOut
            className="shrink-0"
            size={18}
            strokeWidth={1.8}
          />

          <span>
            Sign out
          </span>

        </button>

      </div>

    </aside>
  );
}

/* =====================================================
   ROLE LABEL
===================================================== */

function formatRole(
  role: Role
) {
  switch (role) {
    case "ADMIN":
      return "Administrator";

    case "SALES":
      return "Sales";

    case "WAREHOUSE":
      return "Warehouse";

    case "ACCOUNTS":
      return "Accounts";

    default:
      return "Administrator";
  }
}