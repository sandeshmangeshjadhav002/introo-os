import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  StarOff,
  ArrowRight,
} from "lucide-react";
import {
  useLeads,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useArchiveLead,
  useRestoreLead,
  useFavoriteLead,
  useConvertLead,
} from "../../../hooks/useLeads";
import Modal from "../../../components/Modal";
import { useForm } from "react-hook-form";
import { leadSchema } from "../../../validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../../../stores/useToastStore";
import DataTable from "../../../components/crm/DataTable";

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: leads = [], isLoading } = useLeads();
  const { mutateAsync: createLead } = useCreateLead();
  const { mutateAsync: updateLead } = useUpdateLead();
  const { mutateAsync: deleteLead } = useDeleteLead();
  const { mutateAsync: archiveLead } = useArchiveLead();
  const { mutateAsync: restoreLead } = useRestoreLead();
  const { mutateAsync: favoriteLead } = useFavoriteLead();
  const { mutateAsync: convertLead } = useConvertLead();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsModalOpen(true);
      // Clean up the URL parameter so it doesn't stay open on refresh
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company_id: null,
      contact_id: null,
      budget: null,
      interest: "",
      lead_score: 0,
      lead_source: "",
      campaign: "",
      status: "new",
      assigned_to: null,
      notes: "",
    },
  });

  const {
    register: registerConvert,
    handleSubmit: handleSubmitConvert,
    reset: resetConvert,
    formState: { errors: errorsConvert, isSubmitting: isSubmittingConvert },
  } = useForm({
    defaultValues: {
      deal_name: "",
      deal_amount: "",
      deal_stage: "new",
      contact_name: "",
      company_name: "",
    },
  });

  const handleOpenModal = (lead = null) => {
    setSelectedLead(lead);
    if (lead) {
      reset(lead);
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const handleOpenConvertModal = (lead) => {
    setSelectedLead(lead);
    resetConvert({
      deal_name: lead.name,
      deal_amount: lead.budget,
      deal_stage: "qualified",
      contact_name: lead.name,
      company_name: "",
    });
    setIsConvertModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      const cleanData = {
        ...data,
        budget: isNaN(data.budget) ? null : data.budget,
        lead_score: isNaN(data.lead_score) ? 0 : data.lead_score,
      };
      
      if (selectedLead) {
        await updateLead({ id: selectedLead.id, ...cleanData });
        toast.success("Lead updated successfully");
      } else {
        await createLead(cleanData);
        toast.success("Lead created successfully");
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onConvert = async (data) => {
    try {
      await convertLead({
        leadId: selectedLead.id,
        dealData: {
          name: data.deal_name,
          amount: isNaN(data.deal_amount) ? null : data.deal_amount,
          stage: data.deal_stage,
        },
        contactData: data.contact_name
          ? { first_name: data.contact_name }
          : null,
        companyData: data.company_name
          ? { company_name: data.company_name }
          : null,
      });
      toast.success("Lead converted successfully");
      setIsConvertModalOpen(false);
      resetConvert();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (lead) => {
    try {
      if (lead.is_archived) {
        await restoreLead(lead.id);
        toast.success("Lead restored");
      } else {
        await archiveLead(lead.id);
        toast.success("Lead archived");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLead(id);
      toast.success("Lead deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFavorite = async (lead) => {
    try {
      await favoriteLead({ id: lead.id, isFavorite: !lead.is_favorite });
      toast.success(
        lead.is_favorite
          ? "Lead removed from favorites"
          : "Lead added to favorites",
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    contacted:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    qualified:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    unqualified:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    converted:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Lead Name",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFavorite(lead)}
              className="text-gray-400 hover:text-yellow-500"
            >
              {lead.is_favorite ? (
                <Star className="h-4 w-4 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </button>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {lead.name}
            </span>
          </div>
        );
      },
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
      accessorKey: "lead_score",
      header: "Score",
      cell: ({ row }) => {
        const score = row.original.lead_score;
        const color =
          score >= 80
            ? "text-green-600"
            : score >= 50
              ? "text-yellow-600"
              : "text-red-600";
        return <span className={`font-semibold ${color}`}>{score}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${statusColors[row.original.status] || statusColors.new}`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-1">
            {lead.status !== "converted" && (
              <button
                onClick={() => handleOpenConvertModal(lead)}
                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                title="Convert Lead"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleOpenModal(lead)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleArchive(lead)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {lead.is_archived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleDelete(lead.id)}
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
          Leads
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Lead
        </button>
      </div>

      <DataTable columns={columns} data={leads} isLoading={isLoading} />

      {/* Add/Edit Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLead ? "Edit Lead" : "Add Lead"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lead Name *
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
                Budget
              </label>
              <input
                type="number"
                {...register("budget", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest
              </label>
              <input
                type="text"
                {...register("interest")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lead Score
              </label>
              <input
                type="number"
                {...register("lead_score", { valueAsNumber: true })}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lead Source
              </label>
              <input
                type="text"
                {...register("lead_source")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campaign
              </label>
              <input
                type="text"
                {...register("campaign")}
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
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
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
              {isSubmitting ? "Saving..." : selectedLead ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead"
        size="lg"
      >
        <form onSubmit={handleSubmitConvert(onConvert)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deal Name *
              </label>
              <input
                type="text"
                {...registerConvert("deal_name", { required: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errorsConvert.deal_name && (
                <p className="mt-1 text-sm text-red-600">
                  Deal name is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deal Amount
              </label>
              <input
                type="number"
                {...registerConvert("deal_amount", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stage
              </label>
              <select
                {...registerConvert("deal_stage")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                {...registerConvert("contact_name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                {...registerConvert("company_name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsConvertModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isSubmittingConvert}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              disabled={isSubmittingConvert}
            >
              {isSubmittingConvert ? "Converting..." : "Convert Lead"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
