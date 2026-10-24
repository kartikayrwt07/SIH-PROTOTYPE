import { describe, expect, it } from "vitest";
import {
  switchRole,
  getMe,
  listBureaus,
  listCases,
  getCase,
  transitionCase,
  assignCase,
  escalateCase,
  addNote,
  getNotes,
  getTimeline,
} from "@/api/index";

describe("Mock API Layer & RBAC", () => {
  it("switches demo roles and returns correct permissions", async () => {
    const admin = await switchRole("ADMIN");
    expect(admin.role).toBe("ADMIN");
    expect(admin.permissions).toContain("cases:create");
    expect(admin.permissions).toContain("cases:import");

    const supervisor = await switchRole("SUPERVISOR");
    expect(supervisor.role).toBe("SUPERVISOR");
    expect(supervisor.permissions).toContain("cases:assign");
    expect(supervisor.permissions).not.toContain("cases:import");

    const officer = await switchRole("OFFICER");
    expect(officer.role).toBe("OFFICER");
    expect(officer.bureau_code).toBe("APPR");
    expect(officer.permissions).toContain("cases:read:bureau");

    const auditor = await switchRole("AUDITOR");
    expect(auditor.role).toBe("AUDITOR");
    expect(auditor.permissions).toContain("cases:read:all:redacted");
    expect(auditor.permissions).not.toContain("cases:update:status");
  });

  it("lists all 4 AICTE bureaus with real codes", async () => {
    const bureaus = await listBureaus();
    expect(bureaus).toHaveLength(4);
    const codes = bureaus.map((b) => b.code);
    expect(codes).toContain("APPR");
    expect(codes).toContain("STU");
    expect(codes).toContain("FDC");
    expect(codes).toContain("FIN");
  });

  it("returns 58 seeded cases for ADMIN and SUPERVISOR", async () => {
    await switchRole("ADMIN");
    const result = await listCases({ page_size: 100 });
    expect(result.total).toBe(58);
    expect(result.items.length).toBe(58);
  });

  it("enforces bureau scoping for OFFICER role", async () => {
    await switchRole("OFFICER"); // Assigned to bureau-appr
    const result = await listCases({ page_size: 100 });
    // In our seed, APPR has 22 cases
    expect(result.total).toBe(22);
    result.items.forEach((c) => {
      expect(c.bureau_code).toBe("APPR");
    });
  });

  it("redacts confidential description for AUDITOR role", async () => {
    await switchRole("AUDITOR");
    const cases = await listCases({ page_size: 10 });
    cases.items.forEach((c) => {
      expect(c.description_confidential).toBeUndefined();
    });

    const single = await getCase("AICTE-2026-00001");
    expect(single.description_confidential).toBeUndefined();
  });

  it("executes valid lifecycle transition", async () => {
    await switchRole("ADMIN");
    // Find a Received case or use AICTE-2026-00003 if available
    const cases = await listCases({ status: "Received", page_size: 5 });
    if (cases.items.length > 0) {
      const target = cases.items[0];
      const updated = await transitionCase({
        case_ref: target.case_reference_id,
        to_status: "Registered",
        remarks: "Valid test transition",
      });
      expect(updated.status).toBe("Registered");

      const timeline = await getTimeline(target.case_reference_id);
      expect(timeline.some((t) => t.new_state === "Registered")).toBe(true);
    }
  });

  it("blocks illegal state transition with descriptive error", async () => {
    await switchRole("ADMIN");
    const cases = await listCases({ status: "Received", page_size: 5 });
    if (cases.items.length > 0) {
      const target = cases.items[0];
      await expect(
        transitionCase({
          case_ref: target.case_reference_id,
          to_status: "Resolved", // Received cannot transition directly to Resolved
          remarks: "Illegal move",
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE_TRANSITION",
      });
    }
  });

  it("escalates a case up to maximum level 2", async () => {
    await switchRole("SUPERVISOR");
    const updated = await escalateCase({
      case_ref: "AICTE-2026-00001",
      reason: "Urgent supervisory intervention needed",
    });
    expect(updated.escalation_level).toBeGreaterThanOrEqual(1);
    expect(updated.escalation_level).toBeLessThanOrEqual(2);
  });

  it("reassigns a case and updates assignment history", async () => {
    await switchRole("SUPERVISOR");
    const updated = await assignCase({
      case_ref: "AICTE-2026-00001",
      to_bureau_id: "bureau-stu",
      reason: "Case relates to student welfare issues",
    });
    expect(updated.bureau_code).toBe("STU");
    expect(updated.bureau_id).toBe("bureau-stu");
  });

  it("adds note and filters confidential notes for AUDITOR", async () => {
    await switchRole("SUPERVISOR");
    const ref = "AICTE-2026-00002";

    await addNote({
      case_ref: ref,
      content: "Public inquiry note",
      is_confidential: false,
    });

    await addNote({
      case_ref: ref,
      content: "Highly sensitive informant remark",
      is_confidential: true,
    });

    // Supervisor sees confidential note content
    const supervisorNotes = await getNotes(ref);
    const confNote = supervisorNotes.find((n) => n.is_confidential);
    expect(confNote?.content).toBe("Highly sensitive informant remark");

    // Switch to Auditor: confidential note content must be redacted
    await switchRole("AUDITOR");
    const auditorNotes = await getNotes(ref);
    const auditorConfNote = auditorNotes.find((n) => n.is_confidential);
    expect(auditorConfNote?.content).toContain("Confidential — not visible to Auditor");
  });
});
