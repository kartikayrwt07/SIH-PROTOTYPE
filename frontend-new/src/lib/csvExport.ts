import type { ComplaintCase, UserRole } from "@/types/ui";

export function exportCasesClientCsv(cases: ComplaintCase[], userRole: UserRole): void {
  const isAuditor = userRole === "AUDITOR";

  const headers = [
    "Case Reference ID",
    "Institution AICTE ID",
    "Institution Name",
    "Bureau Code",
    "Bureau Name",
    "Category",
    "Priority",
    "Status",
    "Due Date (IST)",
    "Escalation Tier",
    "Created Date (IST)",
    "Subject",
    "Description (Redacted)",
    ...(isAuditor ? [] : ["Confidential Statement"]),
    "Closure Remarks",
  ];

  const rows = cases.map((c) => {
    const dueIST = c.due_date ? new Date(c.due_date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A";
    const createdIST = new Date(c.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const row = [
      c.case_reference_id,
      c.aicte_permanent_id || "",
      `"${(c.institution_name || "").replace(/"/g, '""')}"`,
      c.bureau_code,
      `"${(c.bureau_name || "").replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      `"${dueIST}"`,
      c.escalation_level.toString(),
      `"${createdIST}"`,
      `"${(c.subject || "").replace(/"/g, '""')}"`,
      `"${(c.description_redacted || "").replace(/"/g, '""')}"`,
      ...(isAuditor ? [] : [`"${(c.description_confidential || "").replace(/"/g, '""')}"`]),
      `"${(c.closure_remarks || "").replace(/"/g, '""')}"`,
    ];
    return row.join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  link.setAttribute("href", url);
  link.setAttribute("download", `aicte_cases_export_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
