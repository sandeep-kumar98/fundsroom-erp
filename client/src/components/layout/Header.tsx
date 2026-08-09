import { Bell, Search } from "lucide-react";

interface StoredUser {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
}

export default function Header() {
  let user: StoredUser = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  const name = user.name || "System Admin";
  const role = user.role || "ADMIN";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">

      <div className="flex w-80 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">

        <Search
          size={17}
          className="text-gray-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />

        <span className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 sm:block">
          /
        </span>

      </div>

      <div className="flex items-center gap-5">

        <button
          type="button"
          className="relative text-gray-500 transition hover:text-gray-900"
        >
          <Bell
            size={19}
            strokeWidth={1.8}
          />

          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gray-900" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-3">

          <div className="text-right">

            <div className="text-sm font-medium text-gray-900">
              {name}
            </div>

            <div className="text-xs text-gray-500">
              {role}
            </div>

          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
            {initials}
          </div>

        </div>

      </div>

    </header>
  );
}