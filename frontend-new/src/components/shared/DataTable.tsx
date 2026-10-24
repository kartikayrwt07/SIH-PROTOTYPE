import React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  emptyInstruction?: string;
  emptyAction?: React.ReactNode;
  rowClassName?: (item: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage = "No records found.",
  emptyInstruction = "Try clearing filters or adjusting your search.",
  emptyAction,
  rowClassName,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full bg-surface border border-rule rounded overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-page border-b border-rule z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "h-9 px-4 py-2 text-xs font-medium text-text-secondary select-none",
                    col.align === "right"
                      ? "text-right tabular-nums"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="h-10 bg-surface">
                  {columns.map((col, cIdx) => (
                    <td
                      key={`skel-c-${cIdx}`}
                      className={cn(
                        "px-4 py-2",
                        col.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      <div
                        className={cn(
                          "h-3.5 bg-rule/50 rounded-[2px] animate-pulse",
                          col.align === "right" ? "ml-auto w-12" : "w-3/4",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-text-secondary"
                >
                  <div className="max-w-sm mx-auto space-y-1">
                    <p className="font-medium text-ink">{emptyMessage}</p>
                    <p className="text-xs text-text-muted">{emptyInstruction}</p>
                    {emptyAction && <div className="pt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const isClickable = !!onRowClick;
                const customClasses = rowClassName ? rowClassName(item) : "";

                return (
                  <tr
                    key={keyField(item)}
                    onClick={() => onRowClick?.(item)}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }}
                    tabIndex={isClickable ? 0 : undefined}
                    role={isClickable ? "button" : undefined}
                    className={cn(
                      "h-10 bg-surface text-ink transition-none",
                      isClickable &&
                        "cursor-pointer hover:bg-page focus:outline-none focus:bg-page focus:ring-1 focus:ring-action",
                      customClasses,
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-2 text-xs",
                          col.align === "right"
                            ? "text-right tabular-nums"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left",
                          col.className,
                        )}
                      >
                        {col.cell(item, idx)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
