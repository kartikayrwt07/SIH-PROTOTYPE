import React, { useState, useRef } from "react";
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { api } from "../../services/api";
import { CsvPreviewResponse, CsvRowPreview } from "../../types";

const SAMPLE_CSV = `subject,description,bureau_code,institution_aicte_id,category,priority,is_confidential
"Irregular Admission Fee Surcharge","College demanded mandatory non-refundable building fund surcharge of INR 45,000 without AICTE fee committee endorsement.","BUR-APPR","1-100234561","Fee & Financial Irregularities","HIGH","false"
"Ragging and Hostile Hostel Intimidation","First-year engineering students subjected to late-night psychological humiliation and forced physical tasks. Warden failed to intervene.","BUR-RAGG","1-100234564","Ragging Allegation","URGENT","true"
"Unapproved Course Offering & Faculty Shortage","Institute advertising non-approved specialized diploma program. Core faculty positions vacant for over 10 months.","BUR-POL","1-100234562","Curriculum & Exam Irregularities","MEDIUM","false"
"Invalid Bureau Submission Test","Deficit in laboratory equipment and chemical supplies.","BUR-NONEXISTENT","1-100234561","Infrastructure Deficit","LOW","false"
"Unregistered Institution Code Test","Faculty members protesting salary delay of three months.","BUR-LEGAL","1-999999999","Faculty Shortage & Qualification","HIGH","false"
`;

interface CsvIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdRefs: string[]) => void;
  isEmbedded?: boolean;
}

export const CsvIngestionModal: React.FC<CsvIngestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isEmbedded = false,
}) => {
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [skipInvalid, setSkipInvalid] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<{
    importedCount: number;
    skippedCount: number;
    createdRefs: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !isEmbedded) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCommitResult(null);
    setValidationError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      runValidation(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCommitResult(null);
    setValidationError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      runValidation(text);
    };
    reader.readAsText(file);
  };

  const runValidation = async (content: string) => {
    if (!content.trim()) return;
    setIsValidating(true);
    setValidationError(null);
    setCommitResult(null);

    try {
      const res = await api.previewCsv(content);
      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setValidationError(res.error?.message || "Failed to validate CSV structure");
        setPreview(null);
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Validation network failure");
      setPreview(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadSample = () => {
    setFileName("sample_aicte_grievances.csv");
    setCsvContent(SAMPLE_CSV);
    runValidation(SAMPLE_CSV);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `subject,description,bureau_code,institution_aicte_id,category,priority,is_confidential
"Sample Complaint Subject","Mandatory detailed narrative of the institution grievance.","BUR-APPR","1-100234561","Fee & Financial Irregularities","HIGH","false"
`;
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "aicte_grievance_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteCommit = async () => {
    if (!preview || preview.valid_rows === 0) return;
    setIsCommitting(true);
    setValidationError(null);

    try {
      // Map valid rows to commit format
      const validRowsToCommit = preview.rows
        .filter((r) => r.is_valid)
        .map((r) => ({
          row_number: r.row_number,
          subject: r.subject,
          description: r.description,
          bureau_code: r.bureau_code,
          institution_aicte_id: r.institution_aicte_id,
          category: r.category,
          priority: r.priority,
          is_confidential: r.is_confidential,
        }));

      const res = await api.commitCsvBatch(validRowsToCommit, skipInvalid);
      if (res.success && res.data) {
        setCommitResult({
          importedCount: res.data.imported_count,
          skippedCount: res.data.skipped_count,
          createdRefs: res.data.created_case_references,
        });
        if (onSuccess) {
          onSuccess(res.data.created_case_references);
        }
      } else {
        setValidationError(res.error?.message || "Failed to execute batch commit");
      }
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Batch commitment failed");
    } finally {
      setIsCommitting(false);
    }
  };

  const resetIngestion = () => {
    setCsvContent("");
    setFileName("");
    setPreview(null);
    setCommitResult(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const contentComponent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header bar when in modal mode */}
      {!isEmbedded && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UploadCloud size={20} color="var(--accent-aicte-blue)" />
              Batch CSV Grievance Ingestion
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Pre-validation dry run &bull; Transaction-safe atomic batch commit &bull; Duplicate detection
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "0.3rem", borderRadius: "6px" }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Instructions & Fast Demo Bar */}
      <div
        style={{
          background: "rgba(18, 28, 56, 0.7)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "0.85rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Upload institutional grievance files for pre-commit schema validation, automated bureau & institution matching, and transactional commit.
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadTemplate}
            style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Download size={14} /> Download Template
          </button>
          <button
            className="btn btn-primary"
            onClick={handleLoadSample}
            style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Sparkles size={14} /> Load Demo Batch (5 Cases)
          </button>
        </div>
      </div>

      {/* Success Confirmation State */}
      {commitResult ? (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "10px",
            padding: "1.75rem",
            textAlign: "center",
          }}
        >
          <CheckCircle2 size={42} color="#10B981" style={{ margin: "0 auto 0.75rem auto" }} />
          <h3 style={{ color: "#FFFFFF", margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>
            Batch Grievance Commitment Complete!
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto 1.25rem auto" }}>
            Successfully imported <strong>{commitResult.importedCount}</strong> cases into the active AICTE grievance repository with initial SLA policies and append-only audit entries.
            {commitResult.skippedCount > 0 && ` (${commitResult.skippedCount} invalid rows skipped).`}
          </p>

          <div
            style={{
              background: "var(--bg-main)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "1rem",
              maxWidth: "520px",
              margin: "0 auto 1.5rem auto",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              Registered Case Dossier Reference IDs:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {commitResult.createdRefs.map((ref) => (
                <span
                  key={ref}
                  className="badge"
                  style={{
                    background: "rgba(37, 99, 235, 0.2)",
                    color: "#93C5FD",
                    border: "1px solid rgba(37, 99, 235, 0.4)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                  }}
                >
                  {ref}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={resetIngestion}>
              <RotateCcw size={15} /> Upload Another File
            </button>
            {!isEmbedded && (
              <button className="btn btn-primary" onClick={onClose}>
                Done & Inspect Register
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--border-subtle)",
              borderRadius: "10px",
              padding: "2rem",
              textAlign: "center",
              background: "rgba(18, 28, 56, 0.3)",
              cursor: "pointer",
              transition: "border-color 0.2s ease",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <UploadCloud size={38} color="var(--accent-aicte-blue)" style={{ margin: "0 auto 0.75rem auto" }} />
            <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem" }}>
              {fileName ? `${fileName} (${csvContent.length} bytes)` : "Click to select CSV or drag & drop file here"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              Supported columns: subject, description, bureau_code, institution_aicte_id, category, priority, is_confidential
            </div>
          </div>

          {/* Error Message */}
          {validationError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#FCA5A5",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                fontSize: "0.85rem",
              }}
            >
              <AlertCircle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Validation Loading */}
          {isValidating && (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
              <div className="animate-spin" style={{ display: "inline-block", marginRight: "0.5rem" }}>
                <RotateCcw size={18} />
              </div>
              Parsing and validating grievance schema against registered AICTE bureaus and institutions...
            </div>
          )}

          {/* Dry-Run Validation Preview Section */}
          {preview && !isValidating && (
            <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: 0 }}>
              {/* Validation Summary Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF" }}>
                    Dry-Run Validation Preview
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem" }}>
                    <span className="badge badge-low">Total: {preview.total_rows}</span>
                    <span className="badge badge-ontrack">Valid: {preview.valid_rows}</span>
                    {preview.invalid_rows > 0 && (
                      <span className="badge badge-urgent">Invalid: {preview.invalid_rows}</span>
                    )}
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={skipInvalid}
                      onChange={(e) => setSkipInvalid(e.target.checked)}
                    />
                    Skip invalid rows during commit
                  </label>

                  <button
                    className="btn btn-primary"
                    disabled={!preview.can_commit || isCommitting}
                    onClick={handleExecuteCommit}
                    style={{ fontSize: "0.85rem" }}
                  >
                    {isCommitting ? (
                      "Committing Transaction..."
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Commit {preview.valid_rows} Valid Cases
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview Rows Table */}
              <div className="table-container" style={{ maxHeight: "380px", overflowY: "auto" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45px" }}>Row</th>
                      <th style={{ width: "100px" }}>Status</th>
                      <th>Subject & Narrative</th>
                      <th>Bureau</th>
                      <th>Institution</th>
                      <th>Category & Priority</th>
                      <th>Validation Errors / Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row: CsvRowPreview) => (
                      <tr
                        key={row.row_number}
                        style={{
                          background: !row.is_valid
                            ? "rgba(239, 68, 68, 0.06)"
                            : row.warnings.length > 0
                            ? "rgba(245, 158, 11, 0.05)"
                            : undefined,
                        }}
                      >
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {row.row_number}
                        </td>
                        <td>
                          {row.is_valid ? (
                            <span className="badge badge-ontrack" style={{ fontSize: "0.7rem" }}>
                              <CheckCircle2 size={12} /> Valid
                            </span>
                          ) : (
                            <span className="badge badge-urgent" style={{ fontSize: "0.7rem" }}>
                              <AlertCircle size={12} /> Invalid
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#FFFFFF", fontSize: "0.85rem" }}>
                            {row.subject}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              marginTop: "0.15rem",
                              maxHeight: "36px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.description}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "rgba(37, 99, 235, 0.15)",
                              color: "#93C5FD",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                            }}
                          >
                            {row.bureau_code}
                          </span>
                          {row.bureau_name && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                              {row.bureau_name}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: "0.8rem", color: "#FFFFFF", fontWeight: 600 }}>
                            {row.institution_name || "Unknown"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            ID: {row.institution_aicte_id}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {row.category}
                          </div>
                          <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.2rem" }}>
                            <span
                              className={`badge badge-${row.priority.toLowerCase()}`}
                              style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}
                            >
                              {row.priority}
                            </span>
                            {row.is_confidential && (
                              <span
                                className="badge badge-urgent"
                                style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}
                              >
                                Confidential
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {row.errors.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {row.errors.map((err, i) => (
                                <span
                                  key={i}
                                  style={{
                                    color: "#FCA5A5",
                                    fontSize: "0.75rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  &bull; {err.message}
                                </span>
                              ))}
                            </div>
                          )}

                          {row.warnings.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: row.errors.length > 0 ? "0.3rem" : 0 }}>
                              {row.warnings.map((warn, i) => (
                                <span
                                  key={i}
                                  style={{
                                    color: "#FCD34D",
                                    fontSize: "0.75rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <AlertTriangle size={12} /> {warn}
                                </span>
                              ))}
                            </div>
                          )}

                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <span style={{ color: "var(--risk-normal)", fontSize: "0.75rem" }}>
                              Passed validation rules
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isEmbedded) {
    return contentComponent;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(11, 19, 43, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "1080px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-active)",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {contentComponent}
      </div>
    </div>
  );
};
