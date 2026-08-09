import { useState } from "react";
import {
  User,
  ShieldCheck,
  Server,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const token = localStorage.getItem("token");

  const [showLogout, setShowLogout] =
    useState(false);

  const name = user.name || "System Admin";
  const email =
    user.email || "admin@fundsroom.com";
  const role = user.role || "ADMIN";

  const initials = name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="space-y-7">

      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
          System
        </p>

        <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account and application settings.
        </p>
      </div>

      {/* ACCOUNT */}

      <section className="border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-500">
              <User size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-950">
                Account
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Your logged-in account information
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-950 text-sm font-semibold text-white">
              {initials}
            </div>

            <div>
              <div className="text-base font-medium text-gray-950">
                {name}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {email}
              </div>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <InfoRow
              label="Name"
              value={name}
            />

            <InfoRow
              label="Email"
              value={email}
            />

            <InfoRow
              label="Role"
              value={role}
            />

            <InfoRow
              label="Account type"
              value="Administrator"
            />

          </div>

        </div>

      </section>

      {/* SECURITY */}

      <section className="border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-500">
              <ShieldCheck size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-950">
                Security
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Authentication status
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          <div className="flex items-center justify-between border border-gray-100 px-4 py-4">

            <div className="flex items-center gap-3">

              <CheckCircle2
                size={18}
                className="text-emerald-600"
              />

              <div>
                <div className="text-sm font-medium text-gray-900">
                  Authentication active
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  Your current session is authenticated.
                </div>
              </div>

            </div>

            <span className="text-xs font-medium text-emerald-700">
              Active
            </span>

          </div>

          <div className="mt-4 flex items-center justify-between border border-gray-100 px-4 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center bg-gray-50 text-gray-500">
                <Server size={16} />
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900">
                  Session token
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  JWT authentication
                </div>
              </div>

            </div>

            <span className="text-xs text-gray-400">
              {token ? "Present" : "Missing"}
            </span>

          </div>

        </div>

      </section>

      {/* APPLICATION */}

      <section className="border border-gray-200 bg-white">

        <div className="border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-500">
              <Server size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-950">
                Application
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                FundsRoom ERP information
              </p>
            </div>

          </div>

        </div>

        <div className="divide-y divide-gray-100">

          <InfoRow
            label="Application"
            value="FundsRoom ERP"
          />

          <InfoRow
            label="Platform"
            value="ERP Platform"
          />

          <InfoRow
            label="Environment"
            value="Development"
          />

        </div>

      </section>

      {/* SIGN OUT */}

      <section className="border border-red-100 bg-white">

        <div className="flex items-center justify-between p-6">

          <div>

            <h2 className="text-sm font-semibold text-gray-950">
              Sign out
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Sign out of your current FundsRoom session.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowLogout(true)
            }
            className="flex h-10 items-center gap-2 border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>

      </section>

      {/* LOGOUT MODAL */}

      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4">

          <div className="w-full max-w-sm bg-white p-6 shadow-xl">

            <h2 className="text-lg font-semibold text-gray-950">
              Sign out?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              You will need to log in again to access the ERP.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowLogout(false)
                }
                className="h-10 border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={logout}
                className="h-10 bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
              >
                Sign out
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">

      <span className="text-xs font-medium text-gray-400">
        {label}
      </span>

      <span className="text-sm text-gray-800">
        {value}
      </span>

    </div>
  );
}