import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  Star,
  Mail,
  Phone,
} from "lucide-react";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useArchiveContact,
  useRestoreContact,
  useFavoriteContact,
} from "../../../hooks/useContacts";
import { useCompanies } from "../../../hooks/useCompanies";
import Modal from "../../../components/Modal";
import { useForm } from "react-hook-form";
import { contactSchema } from "../../../validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../../../stores/useToastStore";
import DataTable from "../../../components/crm/DataTable";

export default function ContactsPage() {
  const { data: contacts = [], isLoading } = useContacts();
  const { data: companies = [] } = useCompanies();
  const { mutateAsync: createContact } = useCreateContact();
  const { mutateAsync: updateContact } = useUpdateContact();
  const { mutateAsync: deleteContact } = useDeleteContact();
  const { mutateAsync: archiveContact } = useArchiveContact();
  const { mutateAsync: restoreContact } = useRestoreContact();
  const { mutateAsync: favoriteContact } = useFavoriteContact();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      job_title: "",
      company_id: null,
      website: "",
      linkedin: "",
      address: "",
      city: "",
      country: "",
      lead_source: "",
      owner_id: null,
      tags: [],
    },
  });

  const handleOpenModal = (contact = null) => {
    setSelectedContact(contact);
    if (contact) {
      reset({
        ...contact,
        tags: contact.tags || [],
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (selectedContact) {
        await updateContact({ id: selectedContact.id, ...data });
        toast.success("Contact updated successfully");
      } else {
        await createContact(data);
        toast.success("Contact created successfully");
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleArchive = async (contact) => {
    try {
      if (contact.is_archived) {
        await restoreContact(contact.id);
        toast.success("Contact restored");
      } else {
        await archiveContact(contact.id);
        toast.success("Contact archived");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      toast.success("Contact deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleFavorite = async (contact) => {
    try {
      await favoriteContact({
        id: contact.id,
        isFavorite: !contact.is_favorite,
      });
      toast.success(
        contact.is_favorite
          ? "Contact removed from favorites"
          : "Contact added to favorites",
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      accessorKey: "first_name",
      header: "Name",
      cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <a
            href={`mailto:${row.original.email}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        if (!row.original.phone) return null;
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{row.original.phone}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "job_title",
      header: "Title",
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
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleFavorite(contact)}
              className={`p-2 rounded-lg transition-colors ${
                contact.is_favorite
                  ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  : "text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Star
                size={16}
                fill={contact.is_favorite ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => handleOpenModal(contact)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleArchive(contact)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {contact.is_archived ? (
                <RotateCcw size={16} />
              ) : (
                <Archive size={16} />
              )}
            </button>
            <button
              onClick={() => handleDelete(contact.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 size={16} />
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
          Contacts
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      <DataTable columns={columns} data={contacts} isLoading={isLoading} />

      {/* Add/Edit Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedContact ? "Edit Contact" : "Add Contact"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                {...register("first_name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                {...register("last_name")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.last_name.message}
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
                type="tel"
                {...register("phone")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title
              </label>
              <input
                type="text"
                {...register("job_title")}
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
                Website
              </label>
              <input
                type="url"
                {...register("website")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                {...register("linkedin")}
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
                Country
              </label>
              <input
                type="text"
                {...register("country")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                {...register("address")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
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
              {isSubmitting ? "Saving..." : selectedContact ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
