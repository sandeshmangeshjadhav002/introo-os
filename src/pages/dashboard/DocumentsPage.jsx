import { useState } from "react";
import {
  Folder,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  MoreVertical,
  Plus,
  Search,
  Upload,
  Star,
  Trash2,
  Download,
  Eye,
  Edit2,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

export default function DocumentsPage() {
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [documents] = useState([
    {
      id: 1,
      name: "Project Proposal.pdf",
      type: "pdf",
      size: "2.4 MB",
      updated: "2 hours ago",
      starred: true,
    },
    {
      id: 2,
      name: "Q2 Financial Report.xlsx",
      type: "spreadsheet",
      size: "1.8 MB",
      updated: "Yesterday",
      starred: false,
    },
    {
      id: 3,
      name: "Product Roadmap.pptx",
      type: "presentation",
      size: "5.2 MB",
      updated: "3 days ago",
      starred: true,
    },
    {
      id: 4,
      name: "Design Mockups.png",
      type: "image",
      size: "800 KB",
      updated: "1 week ago",
      starred: false,
    },
    {
      id: 5,
      name: "Meeting Notes.docx",
      type: "document",
      size: "450 KB",
      updated: "1 week ago",
      starred: false,
    },
  ]);

  const [folders] = useState([
    { id: 1, name: "Projects", count: 12 },
    { id: 2, name: "Finance", count: 8 },
    { id: 3, name: "Design Assets", count: 24 },
    { id: 4, name: "HR Documents", count: 5 },
  ]);

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
      case "document":
        return <FileText className="text-blue-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="text-green-500" />;
      case "presentation":
        return <Presentation className="text-orange-500" />;
      case "image":
        return <ImageIcon className="text-purple-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and organize your files
          </p>
        </div>
        <Button>
          <Upload size={18} className="mr-2" />
          Upload
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg ${
              view === "grid"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg ${
              view === "list"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Folders Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Folders
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Folder
                    className="text-yellow-600 dark:text-yellow-400"
                    size={24}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-gray-500">{folder.count} items</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Documents Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Recent Documents
        </h2>
        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <Star
                        size={16}
                        className={
                          doc.starred ? "fill-yellow-400 text-yellow-500" : ""
                        }
                      />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {doc.name}
                </h3>
                <div className="text-sm text-gray-500 mt-1">
                  {doc.size} • {doc.updated}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download size={14} className="mr-1" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {doc.name}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {doc.size} • {doc.updated}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <Star
                        size={16}
                        className={
                          doc.starred ? "fill-yellow-400 text-yellow-500" : ""
                        }
                      />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <Download size={16} />
                    </button>
                    <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
