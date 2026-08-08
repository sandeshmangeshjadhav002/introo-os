import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { SupabaseProvider } from "./context/SupabaseContext";
import { queryClient } from "./lib/reactQuery";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import CrmPage from "./pages/dashboard/CrmPage";
import ProjectsPage from "./pages/dashboard/ProjectsPage";
import TasksPage from "./pages/dashboard/TasksPage";
import ChatPage from "./pages/dashboard/ChatPage";
import CalendarPage from "./pages/dashboard/CalendarPage";
import DocumentsPage from "./pages/dashboard/DocumentsPage";
import HrPage from "./pages/dashboard/HrPage";
import FinancePage from "./pages/dashboard/FinancePage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import AdminPage from "./pages/dashboard/AdminPage";
import AIChatPage from "./pages/dashboard/AIChatPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <ThemeProvider>
          <ToastContainer />
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="crm/*" element={<CrmPage />} />
                <Route path="projects/*" element={<ProjectsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="hr" element={<HrPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="ai" element={<AIChatPage />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
