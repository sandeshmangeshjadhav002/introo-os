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
  const location = useLocation();
  console.log("CrmPage location:", location);

  return (
    <div className="flex -m-6 h-[calc(100vh+3rem)]">
      {/* CRM Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard/crm"}
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
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </div>
  );
}
