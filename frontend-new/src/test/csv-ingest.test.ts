import { describe, expect, it } from "vitest";
import {
  previewCsv,
  commitCsv,
  getCase,
  listCases,
  switchRole,
} from "@/api/index";
import { SAMPLE_CSV_CONTENT } from "@/components/ingest/sampleData";

describe("Step 6: CSV Ingestion & Bulk Registration", () => {
  it("previews and validates CSV batch with exact error detection for invalid rows", async () => {
    const preview = await previewCsv(SAMPLE_CSV_CONTENT);

    // Exactly matches SPEC §6: 12 valid, 2 invalid across 14 total rows
    expect(preview.total_rows).toBe(14);
    expect(preview.valid_rows).toBe(12);
    expect(preview.invalid_rows).toBe(2);
    expect(preview.can_commit).toBe(true);

    // Find the invalid AICTE ID row
    const invalidIdRow = preview.rows.find(
      (r) => r.institution_aicte_id === "INVALID-999",
    );
    expect(invalidIdRow).toBeDefined();
    expect(invalidIdRow?.is_valid).toBe(false);
    expect(invalidIdRow?.errors.some((e) => e.field === "institution_aicte_id")).toBe(true);

    // Find the unknown bureau code row
    const unknownBureauRow = preview.rows.find(
      (r) => r.bureau_code === "UNKNOWN_BUR",
    );
    expect(unknownBureauRow).toBeDefined();
    expect(unknownBureauRow?.is_valid).toBe(false);
    expect(unknownBureauRow?.errors.some((e) => e.field === "bureau_code")).toBe(true);

    // Verify valid rows have valid bureau codes and priorities
    const validRows = preview.rows.filter((r) => r.is_valid);
    expect(validRows.length).toBe(12);
    validRows.forEach((row) => {
      expect(["APPR", "STU", "FDC", "FIN"]).toContain(row.bureau_code);
      expect(["LOW", "MEDIUM", "HIGH", "URGENT"]).toContain(row.priority);
      expect(row.errors.length).toBe(0);
    });
  });

  it("commits valid rows under ADMIN role and generates official AICTE case reference IDs", async () => {
    await switchRole("ADMIN");
    const preview = await previewCsv(SAMPLE_CSV_CONTENT);
    expect(preview.can_commit).toBe(true);

    const result = await commitCsv(preview.rows);

    expect(result.imported_count).toBe(12);
    expect(result.skipped_count).toBe(2);
    expect(result.failed_count).toBe(0);
    expect(result.created_case_references.length).toBe(12);

    // Verify first generated case reference format
    const firstRef = result.created_case_references[0];
    expect(firstRef).toMatch(/^AICTE-\d{4}-\d+$/);

    // Verify the newly created case can be fetched and has initial 'Received' status
    const createdCase = await getCase(firstRef);
    expect(createdCase.case_reference_id).toBe(firstRef);
    expect(createdCase.status).toBe("Received");
    expect(createdCase.escalation_level).toBe(0);
  });

  it("blocks CSV commitment for unauthorized SUPERVISOR, OFFICER, and AUDITOR roles", async () => {
    const preview = await previewCsv(SAMPLE_CSV_CONTENT);

    // Supervisor attempt should fail
    await switchRole("SUPERVISOR");
    await expect(commitCsv(preview.rows)).rejects.toThrow();

    // Officer attempt should fail
    await switchRole("OFFICER", "bureau-appr");
    await expect(commitCsv(preview.rows)).rejects.toThrow();

    // Auditor attempt should fail
    await switchRole("AUDITOR");
    await expect(commitCsv(preview.rows)).rejects.toThrow();
  });
});
