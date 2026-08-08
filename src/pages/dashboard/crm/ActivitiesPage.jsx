import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  CheckSquare,
  FileText,
} from "lucide-react";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useArchiveActivity,
  useRestoreActivity,
} from "../../../hooks/useActivities";
import Modal from "../../../components/Modal";
import { useForm } from "react-hook-form";
import { activitySchema } from "../../../validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../../../stores/useToastStore";
import DataTable from "../../../components/crm/DataTable";

const activityIcons = {
  task: CheckSquare,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  demo: Calendar,
  "follow-up": MessageSquare,
  reminder: Calendar,
  note: FileText,
};

const activityColors = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ActivitiesPage() {
  const { data: activities = [], isLoading } = useActivities();
  const { mutateAsync: createActivity } = useCreateActivity();
  const { mutateAsync: updateActivity } = useUpdateActivity();
  const { mutateAsync: deleteActivity } = useDeleteActivity();
  const { mutateAsync: archiveActivity } = useArchiveActivity();
  const { mutateAsync: restoreActivity } = useRestoreActivity();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: "note",
      title: "",
      description: "",
      due_date: "",
      completed_at: null,
      priority: "medium",
      is_recurring: false,
      recurrence_rule: "",
      deal_id: null,
      contact_id: null,
      company_id: null,
      lead_id: null,
      assigned_to: null,
    },
  });

  const handleOpenModal = (activity = null) => {
    setSelectedActivity(activity);
    if (activity) {
      reset(activity);
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (selectedActivity) {
        await updateActivity({ id: selectedActivity.id, ...data });
        toast.success("Activity updated successfully");
      } else {
        await createActivity(data);
        toast.success("Activity created successfully");
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (activity) => {
    try {
      if (activity.is_archived) {
        await restoreActivity(activity.id);
        toast.success("Activity restored");
      } else {
        await archiveActivity(activity.id);
        toast.success("Activity archived");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id);
      toast.success("Activity deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const Icon = activityIcons[row.original.type] || FileText;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <span className="capitalize">{row.original.type}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => {
        if (!row.original.due_date) return null;
        const date = new Date(row.original.due_date);
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${activityColors[row.original.priority] || activityColors.medium}`}
        >
          {row.original.priority}
        </span>
      ),
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned To",
      cell: ({ row }) => row.original.assigned_to?.full_name || "-",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenModal(activity)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleArchive(activity)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {activity.is_archived ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleDelete(activity.id)}
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
          Activities
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Activity
        </button>
      </div>

      <DataTable columns={columns} data={activities} isLoading={isLoading} />

      {/* Add/Edit Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedActivity ? "Edit Activity" : "Add Activity"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="task">Task</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="demo">Demo</option>
                <option value="follow-up">Follow-up</option>
                <option value="reminder">Reminder</option>
                <option value="note">Note</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                {...register("title")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                {...register("due_date")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_recurring"
                {...register("is_recurring")}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="is_recurring"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Recurring Activity
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recurrence Rule
              </label>
              <input
                type="text"
                {...register("recurrence_rule")}
                placeholder="e.g., daily, weekly, monthly"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {isSubmitting
                ? "Saving..."
                : selectedActivity
                  ? "Update"
                  : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
