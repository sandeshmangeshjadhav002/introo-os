import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Download,
  Search,
  Settings,
} from "lucide-react";
import { useState } from "react";

export default function DataTable({
  columns,
  data,
  isLoading,
  pageCount = -1,
  onRowClick,
  selectedRows = [],
  onSelectedRowsChange,
  enablePagination = true,
  enableSorting = true,
  enableColumnFilters = true,
  enableGlobalFilter = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  onExport,
  renderRowActions,
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      globalFilter,
      rowSelection: selectedRows.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {}),
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    enableSorting,
    enableColumnFilters,
    enableGlobalFilter,
    enableColumnVisibility,
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      if (onSelectedRowsChange) {
        const newSelection =
          typeof updater === "function"
            ? updater(table.getState().rowSelection)
            : updater;
        onSelectedRowsChange(Object.keys(newSelection));
      }
    },
    manualPagination: pageCount > 0,
  });

  return (
    <div className="w-full">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {enableGlobalFilter && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}

          {enableColumnVisibility && (
            <div className="relative">
              <button className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Settings className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {table
                    .getAllLeafColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {column.id}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-xs">
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted()] ?? "↕"}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                {renderRowActions && (
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Actions
                  </th>
                )}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  )}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                  {renderRowActions && (
                    <td className="px-4 py-4">
                      {renderRowActions(row.original)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (renderRowActions ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {table.getState().pagination.pageIndex * 10 + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * 10,
              table.getFilteredRowModel().rows.length,
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
