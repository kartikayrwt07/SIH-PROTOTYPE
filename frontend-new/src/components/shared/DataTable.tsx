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
    <div className={cn("w-full bg-white/85 dark:bg-[#171226]/85 backdrop-blur-md border border-[#ECE6F4] dark:border-[#2C233E] rounded-[10px] overflow-hidden shadow-[0_4px_24px_rgba(112,82,200,0.03)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 bg-white/90 dark:bg-[#1B152B]/90 backdrop-blur-md border-b border-[#ECE6F4] dark:border-[#2C233E] z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "h-10.5 px-4.5 py-2.5 text-xs font-semibold text-text-secondary select-none",
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
          <tbody className="divide-y divide-[#ECE6F4] dark:divide-[#2C233E]">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="h-12 bg-surface">
                  {columns.map((col, cIdx) => (
                    <td
                      key={`skel-c-${cIdx}`}
                      className={cn(
                        "px-4.5 py-3.5",
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
                  className="px-4 py-14 text-center text-sm text-text-secondary"
                >
                  <div className="max-w-sm mx-auto space-y-1.5">
                    <p className="font-serif text-base font-semibold text-ink">{emptyMessage}</p>
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
                      "min-h-[46px] bg-surface dark:bg-[#171226] text-ink dark:text-[#EDE8F5] transition-colors",
                      isClickable &&
                        "cursor-pointer hover:bg-[#FAF8FE] dark:hover:bg-[#7052C8]/10 focus:outline-none focus:bg-[#FAF8FE] dark:focus:bg-[#7052C8]/10 focus:ring-1 focus:ring-action",
                      customClasses,
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4.5 py-3.5 text-xs",
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
