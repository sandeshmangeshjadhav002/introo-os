import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Layout,
  Filter,
  Grid3X3,
  Edit,
  Archive,
  Trash2,
} from "lucide-react";
import {
  useDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useArchiveDeal,
  useRestoreDeal,
} from "../../../hooks/useDeals";
import { useCompanies } from "../../../hooks/useCompanies";
import { useContacts } from "../../../hooks/useContacts";
import Modal from "../../../components/Modal";
import DataTable from "../../../components/crm/DataTable";
import KanbanBoard from "../../../components/crm/KanbanBoard";
import { useForm } from "react-hook-form";
import { dealSchema } from "../../../validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../../../stores/useToastStore";

const stages = [
  { id: "new", name: "New", color: "#3B82F6" },
  { id: "qualified", name: "Qualified", color: "#10B981" },
  { id: "proposal", name: "Proposal", color: "#F59E0B" },
  { id: "negotiation", name: "Negotiation", color: "#8B5CF6" },
  { id: "won", name: "Won", color: "#059669" },
  { id: "lost", name: "Lost", color: "#EF4444" },
];

export default function DealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: deals = [], isLoading } = useDeals();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { mutateAsync: createDeal } = useCreateDeal();
  const { mutateAsync: updateDeal } = useUpdateDeal();
  const { mutateAsync: deleteDeal } = useDeleteDeal();
  const { mutateAsync: archiveDeal } = useArchiveDeal();
  const { mutateAsync: restoreDeal } = useRestoreDeal();

  const [viewMode, setViewMode] = useState("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

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
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: "",
      amount: 0,
      currency: "USD",
      stage: "new",
      company_id: null,
      contact_id: null,
      probability: 50,
      close_date: "",
      description: "",
      tags: [],
    },
  });

  const handleOpenModal = (deal = null) => {
    setSelectedDeal(deal);
    if (deal) {
      reset({
        ...deal,
        name: deal.name || deal.title,
        amount: deal.amount || deal.value,
        tags: deal.tags || [],
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (selectedDeal) {
        await updateDeal({ id: selectedDeal.id, ...data });
        toast.success("Deal updated successfully");
      } else {
        await createDeal(data);
        toast.success("Deal created successfully");
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (deal) => {
    try {
      if (deal.is_archived) {
        await restoreDeal(deal.id);
        toast.success("Deal restored");
      } else {
        await archiveDeal(deal.id);
        toast.success("Deal archived");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      toast.success("Deal deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const kanbanData = stages.map((stage) => ({
    id: stage.id,
    title: stage.name,
    color: stage.color,
    deals: deals.filter((deal) => deal.stage === stage.id),
  }));

  const tableColumns = [
    {
      accessorKey: "name",
      header: "Deal Name",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `$${(row.original.amount || 0).toLocaleString()}`,
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span
          className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${
            row.original.stage === "won"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : row.original.stage === "lost"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          }
        `}
        >
          {row.original.stage?.charAt(0).toUpperCase() +
            row.original.stage?.slice(1)}
        </span>
      ),
    },
    {
      accessorKey: "company_id",
      header: "Company",
      cell: ({ row }) => {
        const company = companies.find((c) => c.id === row.original.company_id);
        return company?.name || "-";
      },
    },
    {
      accessorKey: "close_date",
      header: "Close Date",
      cell: ({ row }) => {
        if (!row.original.close_date) return null;
        const date = new Date(row.original.close_date);
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenModal(row.original)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleArchive(row.original)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Archive size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Deals
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Layout size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Grid3X3 size={20} />
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Deal
          </button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoard
          stages={kanbanData}
          onEditDeal={handleOpenModal}
          onArchiveDeal={handleArchive}
          onDeleteDeal={handleDelete}
        />
      ) : (
        <DataTable columns={tableColumns} data={deals} isLoading={isLoading} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDeal ? "Edit Deal" : "Add Deal"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deal Name *
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount *
              </label>
              <div className="flex gap-2">
                <select
                  {...register("currency")}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input
                  type="number"
                  {...register("amount", { valueAsNumber: true })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stage
              </label>
              <select
                {...register("stage")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                {...register("probability", { valueAsNumber: true })}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                {...register("close_date")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <select
                {...register("company_id")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Contact
              </label>
              <select
                {...register("contact_id")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
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
              {isSubmitting ? "Saving..." : selectedDeal ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
