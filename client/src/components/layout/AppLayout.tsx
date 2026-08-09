import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}