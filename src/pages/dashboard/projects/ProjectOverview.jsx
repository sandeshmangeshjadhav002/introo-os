import { useState } from "react";
import {
  Plus,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
  CheckSquare,
} from "lucide-react";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import KPICard from "../../../components/KPICard";
import Skeleton from "../../../components/Skeleton";
import EmptyState from "../../../components/EmptyState";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "../../../hooks/useProjects";
import { useTasks } from "../../../hooks/useTasks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "../../../stores/useToastStore";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z
    .enum(["planning", "in_progress", "on_hold", "completed", "cancelled"])
    .default("planning"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  budget: z.number().optional(),
  is_private: z.boolean().default(false),
});

export default function ProjectOverview() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      start_date: "",
      end_date: "",
      progress: 0,
      budget: undefined,
      is_private: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      const cleanData = {
        ...data,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        budget: isNaN(data.budget) ? null : data.budget,
      };

      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, ...cleanData });
        toast.success("Project updated successfully");
      } else {
        await createProject.mutateAsync(cleanData);
        toast.success("Project created successfully");
      }
      setIsModalOpen(false);
      setEditingProject(null);
      reset();
    } catch (error) {
      toast.error(error.message);
      console.error("Error saving project:", error);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setValue("name", project.name);
    setValue("description", project.description || "");
    setValue("status", project.status);
    setValue("priority", project.priority);
    setValue("start_date", project.start_date || "");
    setValue("end_date", project.end_date || "");
    setValue("progress", project.progress);
    setValue("budget", project.budget);
    setValue("is_private", project.is_private || false);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (id) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "in_progress":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "on_hold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle size={14} />;
      case "high":
        return <AlertCircle size={14} />;
      case "medium":
        return <Clock size={14} />;
      case "low":
        return <CheckCircle2 size={14} />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const totalProjects = projects?.length || 0;
  const completedProjects =
    projects?.filter((p) => p.status === "completed").length || 0;
  const inProgressProjects =
    projects?.filter((p) => p.status === "in_progress").length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectsLoading || tasksLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KPICard
              title="Total Projects"
              value={totalProjects}
              icon={FolderKanban}
              color="blue"
            />
            <KPICard
              title="In Progress"
              value={inProgressProjects}
              icon={Clock}
              color="purple"
            />
            <KPICard
              title="Completed"
              value={completedProjects}
              icon={CheckCircle2}
              color="green"
            />
            <KPICard
              title="Total Tasks"
              value={totalTasks}
              icon={CheckSquare}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Projects List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Your Projects
        </h2>
        <Button
          onClick={() => {
            setEditingProject(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} className="mr-2" />
          New Project
        </Button>
      </div>

      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
        </div>
      ) : projects?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleEditProject(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white">
                    <FolderKanban size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    >
                      <AlertCircle size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status.replace("_", " ")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}
                  >
                    {getPriorityIcon(project.priority)}
                    {project.priority}
                  </span>
                </div>
                {project.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  {project.start_date && (
                    <span>
                      Start: {new Date(project.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {project.end_date && (
                    <span>
                      End: {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to get started"
          action={
            <Button
              onClick={() => {
                setEditingProject(null);
                reset();
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} className="mr-2" />
              Create Project
            </Button>
          }
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        title={editingProject ? "Edit Project" : "Create New Project"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...register("start_date")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                {...register("end_date")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register("progress", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget
              </label>
              <input
                type="number"
                step="0.01"
                {...register("budget", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsModalOpen(false);
                setEditingProject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createProject.isPending || updateProject.isPending}
            >
              {createProject.isPending || updateProject.isPending
                ? "Saving..."
                : editingProject
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
