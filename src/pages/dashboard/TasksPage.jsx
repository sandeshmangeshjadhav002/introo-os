import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Users,
  GripVertical,
  Copy,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Skeleton from "../../components/Skeleton";
import EmptyState from "../../components/EmptyState";
import { useProjects } from "../../hooks/useProjects";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDuplicateTask,
} from "../../hooks/useTasks";
import { useSprints } from "../../hooks/useSprints";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../../stores/useToastStore";

const taskSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z
    .enum(["todo", "in_progress", "review", "done", "cancelled"])
    .default("todo"),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().optional().nullable(),
  sprint_id: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).default(0),
});

const columns = [
  {
    key: "todo",
    label: "To Do",
    accent: "border-gray-300 dark:border-gray-600",
  },
  { key: "in_progress", label: "In Progress", accent: "border-blue-500" },
  { key: "review", label: "Review", accent: "border-purple-500" },
  { key: "done", label: "Done", accent: "border-green-500" },
];

export default function TasksPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: sprints, isLoading: sprintsLoading } = useSprints();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const duplicateTask = useDuplicateTask();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      project_id: "",
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      due_date: "",
      estimated_hours: null,
      sprint_id: null,
      progress: 0,
    },
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      const matchesSearch =
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject =
        !selectedProject || task.project_id === selectedProject;
      const matchesPriority =
        !selectedPriority || task.priority === selectedPriority;
      const matchesSprint =
        !selectedSprint || task.sprint_id === selectedSprint;
      return (
        matchesSearch && matchesProject && matchesPriority && matchesSprint
      );
    });
  }, [tasks, searchQuery, selectedProject, selectedPriority, selectedSprint]);

  const onSubmit = async (data) => {
    try {
      const cleanData = {
        ...data,
        due_date: data.due_date || null,
        estimated_hours: isNaN(data.estimated_hours) ? null : data.estimated_hours,
        sprint_id: data.sprint_id || null,
        progress: isNaN(data.progress) ? 0 : data.progress,
      };
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...cleanData });
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync(cleanData);
        toast.success("Task created successfully");
      }
      setIsModalOpen(false);
      setEditingTask(null);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setValue("project_id", task.project_id);
    setValue("title", task.title);
    setValue("description", task.description || "");
    setValue("priority", task.priority);
    setValue("status", task.status);
    setValue("due_date", task.due_date || "");
    setValue("estimated_hours", task.estimated_hours || null);
    setValue("sprint_id", task.sprint_id || null);
    setValue("progress", task.progress || 0);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask.mutateAsync(id);
      } catch (error) {
        alert(`Error deleting task: ${error.message}`);
      }
    }
  };

  const handleDuplicateTask = async (task) => {
    try {
      await duplicateTask.mutateAsync(task.id);
    } catch (error) {
      alert(`Error duplicating task: ${error.message}`);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
    } catch (error) {
      alert(`Error updating status: ${error.message}`);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle size={14} className="text-red-500" />;
      case "high":
        return <AlertCircle size={14} className="text-orange-500" />;
      case "medium":
        return <Clock size={14} className="text-yellow-600" />;
      case "low":
        return <CheckCircle2 size={14} className="text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900";
      case "high":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900";
      case "medium":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900";
      case "low":
        return "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900";
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const getProjectColor = (task) => {
    const color = task.project?.color || "#3b82f6";
    return color;
  };

  const getTasksByStatus = (status) =>
    filteredTasks.filter((task) => task.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            All Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and organize your team's work
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingTask(null);
              reset();
              setValue("project_id", "");
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Projects</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Sprints</option>
              {sprints?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((column) => (
          <div key={column.key} className="flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1 h-6 rounded-full bg-current ${column.accent.replace("border-", "text-").split(" ")[0]}`}
                ></div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide">
                  {column.label}
                </h3>
                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {getTasksByStatus(column.key).length}
                </span>
              </div>
            </div>

            {tasksLoading || projectsLoading || sprintsLoading ? (
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-3 min-h-[200px]">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
              </div>
            ) : (
              <div
                className={`flex-1 space-y-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-3 min-h-[200px] border-t-2 ${column.accent}`}
              >
                <AnimatePresence mode="popLayout">
                  {getTasksByStatus(column.key).length > 0 ? (
                    getTasksByStatus(column.key).map((task, idx) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                      >
                        <Card
                          className="p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                          onClick={() => handleEditTask(task)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: getProjectColor(task),
                                }}
                              />
                              {task.project && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                  {task.project.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                title="Duplicate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateTask(task);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                title="Edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityColor(task.priority)}`}
                            >
                              {getPriorityIcon(task.priority)}
                              <span className="capitalize">
                                {task.priority}
                              </span>
                            </span>
                            {Number.isInteger(task.progress) &&
                              task.progress > 0 && (
                                <span className="text-xs text-gray-500 font-medium">
                                  {task.progress}%
                                </span>
                              )}
                          </div>

                          {(task.progress > 0 || task.subtasks?.length > 0) && (
                            <div className="mb-3">
                              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width:
                                      task.status === "done"
                                        ? "100%"
                                        : `${task.progress || 0}%`,
                                  }}
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    backgroundColor: getProjectColor(task),
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(task.due_date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" },
                                  )}
                                </span>
                              )}
                              {task.estimated_hours && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {task.estimated_hours}h
                                </span>
                              )}
                              {task.subtasks?.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  {
                                    task.subtasks.filter((s) => s.is_completed)
                                      .length
                                  }
                                  /{task.subtasks.length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {task.assigned_user?.avatar_url ? (
                                <img
                                  src={task.assigned_user.avatar_url}
                                  alt={task.assigned_user.full_name}
                                  className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                />
                              ) : task.assigned_user?.full_name ? (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                                  style={{
                                    backgroundColor: getProjectColor(task),
                                  }}
                                >
                                  {task.assigned_user.full_name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No tasks"
                      description={`Move tasks here or create new ones`}
                      compact
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Title *
            </label>
            <input
              {...register("title")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Describe your task"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1.5">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Project *
            </label>
            <select
              {...register("project_id")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select a project</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.project_id && (
              <p className="text-sm text-red-500 mt-1.5">
                {errors.project_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                {...register("due_date")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Hours
              </label>
              <input
                type="number"
                min="0"
                {...register("estimated_hours", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="8"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Sprint
              </label>
              <select
                {...register("sprint_id")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">None</option>
                {sprints
                  ?.filter(
                    (s) =>
                      !watch("project_id") ||
                      s.project_id === watch("project_id"),
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Progress: {watch("progress") || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              {...register("progress", { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {createTask.isPending || updateTask.isPending
                ? "Saving..."
                : editingTask
                  ? "Update Task"
                  : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
