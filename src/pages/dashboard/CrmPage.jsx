import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Building2,
  Target,
  Calendar,
  FileText,
} from "lucide-react";
import CrmDashboard from "./crm/CrmDashboard";
import ContactsPage from "./crm/ContactsPage";
import DealsPage from "./crm/DealsPage";
import CompaniesPage from "./crm/CompaniesPage";
import LeadsPage from "./crm/LeadsPage";
import ActivitiesPage from "./crm/ActivitiesPage";
import ReportsPage from "./crm/ReportsPage";

const navItems = [
  { path: "/dashboard/crm", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/crm/deals", label: "Deals", icon: TrendingUp },
  { path: "/dashboard/crm/contacts", label: "Contacts", icon: Users },
  { path: "/dashboard/crm/companies", label: "Companies", icon: Building2 },
  { path: "/dashboard/crm/leads", label: "Leads", icon: Target },
  { path: "/dashboard/crm/activities", label: "Activities", icon: Calendar },
  { path: "/dashboard/crm/reports", label: "Reports", icon: FileText },
];

export default function CrmPage() {
  return (
    <div className="flex flex-col lg:flex-row -m-6 min-h-[calc(100vh-8rem)]">
      {/* CRM Sidebar */}
      <aside className="w-full lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 lg:p-6 overflow-x-auto lg:overflow-visible">
        <div className="mb-4 hidden lg:block">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-gray-100">
            CRM
          </h2>
        </div>
        <nav className="flex lg:flex-col gap-1 lg:space-y-1 whitespace-nowrap">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard/crm"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-[#2563EB] text-white font-medium shadow-sm"
                    : "text-[#64748B] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#0F172A] dark:hover:text-gray-100"
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span className="font-medium">{item.label}</span>
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
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </div>
  );
}
