import {
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  FileText,
  CheckCircle,
  User,
} from "lucide-react";

const activityIcons = {
  note: FileText,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  task: CheckCircle,
  "follow-up": MessageSquare,
  reminder: Calendar,
  demo: TrendingUp,
  sms: MessageSquare,
  whatsapp: MessageSquare,
};

const activityColors = {
  note: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  call: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  meeting: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  email: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  task: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  "follow-up": "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  reminder: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  demo: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  sms: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  whatsapp: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Timeline({ items = [] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <TimelineItem key={item.id || index} item={item} />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ item }) {
  const Icon = activityIcons[item.type] || FileText;
  const colorClass = activityColors[item.type] || activityColors.note;

  return (
    <div className="relative pl-10">
      <div
        className={`absolute left-0 top-0 p-2 rounded-full ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {item.type}
            </h4>
            {item.title && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {item.title}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(item.created_at || item.date)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {item.description}
          </p>
        )}
        {item.user && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3" />
            <span>{item.user.name || item.user.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
