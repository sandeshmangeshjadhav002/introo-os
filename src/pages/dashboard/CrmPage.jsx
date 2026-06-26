import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  Target,
  Calendar,
  FileText,
  Settings,
} from "lucide-react";
import CrmDashboard from "./crm/CrmDashboard";
import ContactsPage from "./crm/ContactsPage";
import DealsPage from "./crm/DealsPage";

const navItems = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "deals", label: "Deals", icon: TrendingUp },
  { path: "contacts", label: "Contacts", icon: Users },
  { path: "companies", label: "Companies", icon: Building2 },
  { path: "leads", label: "Leads", icon: Target },
  { path: "activities", label: "Activities", icon: Calendar },
  { path: "reports", label: "Reports", icon: FileText },
];

export default function CrmPage() {
  return (
    <div className="flex -m-6 h-[calc(100vh+3rem)]">
      {/* CRM Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-500 text-white font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* CRM Content */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<CrmDashboard />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route
            path="companies"
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Companies
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Coming soon...
                </p>
              </div>
            }
          />
          <Route
            path="leads"
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Leads
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Coming soon...
                </p>
              </div>
            }
          />
          <Route
            path="activities"
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Activities
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Coming soon...
                </p>
              </div>
            }
          />
          <Route
            path="reports"
            element={
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Reports
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Coming soon...
                </p>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
