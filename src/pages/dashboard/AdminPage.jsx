import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Database,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "../../context/SupabaseContext";
import { toast } from "../../stores/useToastStore";

const userSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z
    .enum(["super_admin", "admin", "manager", "employee"])
    .default("employee"),
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "employee",
    },
  });
  const { supabase, organization } = useSupabase();

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    if (!organization) return;
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, created_at, organization_id")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load users: " + error.message);
        return;
      }
      setUsers(data || []);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [organization]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles & Permissions", icon: Shield },
    { id: "data", label: "Data Management", icon: Database },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const getRoleBadge = (role) => {
    const colors = {
      super_admin:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      manager:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      employee: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role]}`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === "active"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {status}
      </span>
    );
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    reset({
      full_name: user.full_name || user.name || "",
      email: user.email || "",
      role: user.role || "employee",
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user) => {
    if (!user.id || typeof user.id !== "string") return;
    if (
      !confirm(
        `Remove user ${user.full_name || user.email}? This will NOT delete their auth account, only their profile access.`,
      )
    )
      return;

    setIsDeleting(user.id);
    try {
      const { error } = await supabase
        .from("users")
        .update({ organization_id: null, role: "employee" })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("User removed from organization");
      await fetchUsers();
    } catch (err) {
      toast.error(err.message || "Failed to remove user");
    } finally {
      setIsDeleting(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      if (editingUser && typeof editingUser.id === "string") {
        const { error } = await supabase
          .from("users")
          .update({
            full_name: data.full_name,
            email: data.email,
            role: data.role,
          })
          .eq("id", editingUser.id);

        if (error) throw error;
        toast.success("User updated — role and details saved");
      } else {
        // Since public.users.id references auth.users(id) we cannot pre-create
        // a profile before the user actually signs up. Instead upsert by email
        // so that when the user registers via the handle_new_user trigger with
        // ON CONFLICT (id) DO NOTHING, the row is not replaced. We use DO NOTHING
        // on email conflict since emails are unique per org anyway.
        const { error: findError } = await supabase
          .from("users")
          .select("id, email")
          .eq("organization_id", organization?.id)
          .eq("email", data.email.toLowerCase().trim())
          .maybeSingle();

        if (findError) throw findError;

        toast.info(
          `Ask ${data.email} to sign up via the Register page first. Once they join your organization, you can assign a role by editing them here.`,
        );
        setIsModalOpen(false);
        setIsSaving(false);
        return;
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your workspace
          </p>
        </div>
        {activeTab === "users" && (
          <Button
            onClick={() => {
              setEditingUser(null);
              reset();
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" />
            Add User
          </Button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <Card className="p-6">
            {isLoadingUsers ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No users match your search."
                  : "No users in this organization yet."}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.map((user) => {
                  const displayName = user.full_name || user.name || user.email;
                  const initials =
                    displayName
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?";
                  const status = user.organization_id ? "active" : "inactive";

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {displayName}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(status)}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                            title="Edit user / role"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isDeleting === user.id}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 disabled:opacity-50"
                            title="Remove from organization"
                          >
                            <Trash2
                              size={16}
                              className={
                                isDeleting === user.id ? "animate-spin" : ""
                              }
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["super_admin", "admin", "manager", "employee"].map((role) => (
            <Card key={role} className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                {role.replace("_", " ")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage permissions for this role
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                Edit Permissions
              </Button>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "data" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Export Data
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Export all your workspace data
            </p>
            <Button className="mt-4">Export Data</Button>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Import Data
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Import data from CSV files
            </p>
            <Button variant="outline" className="mt-4">
              Import Data
            </Button>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Workspace Settings
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your workspace configuration
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                defaultValue="My Company"
              />
            </div>
            <Button>Save Settings</Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSaving) setIsModalOpen(false);
        }}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              {...register("full_name")}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-60"
            />
            {errors.full_name && (
              <p className="text-sm text-red-500 mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              {...register("email")}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-60"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              {...register("role")}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-60"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving
                ? editingUser
                  ? "Updating..."
                  : "Adding..."
                : editingUser
                  ? "Update User"
                  : "Add User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
