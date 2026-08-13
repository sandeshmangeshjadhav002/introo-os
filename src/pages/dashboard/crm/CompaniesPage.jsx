import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  StarOff,
} from "lucide-react";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useArchiveCompany,
  useRestoreCompany,
  useFavoriteCompany,
} from "../../../hooks/useCompanies";
import Modal from "../../../components/Modal";
import { useForm } from "react-hook-form";
import { companySchema } from "../../../validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../../../stores/useToastStore";
import DataTable from "../../../components/crm/DataTable";

export default function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: companies = [], isLoading } = useCompanies();
  const { mutateAsync: createCompany } = useCreateCompany();
  const { mutateAsync: updateCompany } = useUpdateCompany();
  const { mutateAsync: deleteCompany } = useDeleteCompany();
  const { mutateAsync: archiveCompany } = useArchiveCompany();
  const { mutateAsync: restoreCompany } = useRestoreCompany();
  const { mutateAsync: favoriteCompany } = useFavoriteCompany();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsModalOpen(true);
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: "",
      industry: "",
      website: "",
      email: "",
      phone: "",
      employees: null,
      revenue: null,
      gst_number: "",
      address: "",
      country: "",
      state: "",
      city: "",
      zip: "",
      assigned_to: null,
      notes: "",
    },
  });

  const handleOpenModal = (company = null) => {
    setSelectedCompany(company);
    if (company) {
      reset(company);
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (selectedCompany) {
        await updateCompany({ id: selectedCompany.id, ...data });
        toast.success("Company updated successfully");
      } else {
        await createCompany(data);
        toast.success("Company created successfully");
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (company) => {
    try {
      if (company.is_archived) {
        await restoreCompany(company.id);
        toast.success("Company restored");
      } else {
        await archiveCompany(company.id);
        toast.success("Company archived");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCompany(id);
      toast.success("Company deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFavorite = async (company) => {
    try {
      await favoriteCompany({
        id: company.id,
        isFavorite: !company.is_favorite,
      });
      toast.success(
        company.is_favorite
          ? "Company removed from favorites"
          : "Company added to favorites",
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      accessorKey: "company_name",
      header: "Company Name",
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFavorite(company)}
              className="text-gray-400 hover:text-yellow-500"
            >
              {company.is_favorite ? (
                <Star className="h-4 w-4 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </button>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {company.company_name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "industry",
      header: "Industry",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          active:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          inactive:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
          lead: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        };
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.active}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenModal(company)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleArchive(company)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {company.is_archived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleDelete(company.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Companies
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <DataTable columns={columns} data={companies} isLoading={isLoading} />

      {/* Add/Edit Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCompany ? "Edit Company" : "Add Company"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                {...register("company_name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Industry
              </label>
              <input
                type="text"
                {...register("industry")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="text"
                {...register("website")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="text"
                {...register("phone")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employees
              </label>
              <input
                type="number"
                {...register("employees", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Revenue
              </label>
              <input
                type="number"
                {...register("revenue", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Number
              </label>
              <input
                type="text"
                {...register("gst_number")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                {...register("address")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <input
                type="text"
                {...register("country")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                type="text"
                {...register("state")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                {...register("city")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP/Postal Code
              </label>
              <input
                type="text"
                {...register("zip")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : selectedCompany ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
