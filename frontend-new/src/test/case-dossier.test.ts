import { describe, expect, it } from "vitest";
import {
  getCase,
  getTimeline,
  getNotes,
  addNote,
  getAssignmentHistory,
  assignCase,
  escalateCase,
  transitionCase,
  switchRole,
} from "@/api/index";

describe("Step 3: Case Dossier", () => {
  const caseRef = "AICTE-2026-00004";

  it("retrieves comprehensive case dossier by reference ID", async () => {
    await switchRole("ADMIN");
    const c = await getCase(caseRef);

    expect(c.case_reference_id).toBe(caseRef);
    expect(c.institution_name).toBeTruthy();
    expect(c.bureau_code).toBeTruthy();
    expect(c.subject).toBeTruthy();
    expect(c.description_redacted).toBeTruthy();
    expect(c.priority).toBeTruthy();
    expect(c.status).toBeTruthy();
  });

  it("retrieves immutable audit timeline entries", async () => {
    await switchRole("SUPERVISOR");
    const timeline = await getTimeline("AICTE-2026-00001");

    expect(Array.isArray(timeline)).toBe(true);
    if (timeline.length > 0) {
      const first = timeline[0];
      expect(first.event_type).toBeTruthy();
      expect(first.actor_role).toBeTruthy();
      expect(first.timestamp).toBeTruthy();
    }
  });

  it("adds internal notes and enforces Auditor redaction", async () => {
    await switchRole("SUPERVISOR");
    const note = await addNote({
      case_ref: caseRef,
      content: "Investigation notice served to Dean of Academics.",
      is_confidential: true,
    });

    expect(note.is_confidential).toBe(true);

    // Supervisor view
    const supNotes = await getNotes(caseRef);
    const found = supNotes.find((n) => n.id === note.id);
    expect(found?.content).toBe("Investigation notice served to Dean of Academics.");

    // Auditor view: content must be masked
    await switchRole("AUDITOR");
    const audNotes = await getNotes(caseRef);
    const audFound = audNotes.find((n) => n.id === note.id);
    expect(audFound?.content).toContain("Confidential — not visible to Auditor");
  });

  it("reassigns case and updates assignment history", async () => {
    await switchRole("ADMIN");
    const targetRef = "AICTE-2026-00005";

    const updated = await assignCase({
      case_ref: targetRef,
      to_bureau_id: "bureau-fdc",
      reason: "Matter involves faculty salary grievance under 7th CPC.",
    });

    expect(updated.bureau_code).toBe("FDC");

    const history = await getAssignmentHistory(targetRef);
    expect(history.length).toBeGreaterThan(0);
    const latest = history[history.length - 1];
    expect(latest.to_bureau_id).toBe("bureau-fdc");
    expect(latest.transfer_reason).toContain("7th CPC");
  });

  it("blocks reassignment for OFFICER and AUDITOR roles", async () => {
    await switchRole("OFFICER");
    await expect(
      assignCase({
        case_ref: caseRef,
        to_bureau_id: "bureau-stu",
        reason: "Unauthorized reassign",
      }),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_ROLE_PERMISSIONS",
    });

    await switchRole("AUDITOR");
    await expect(
      assignCase({
        case_ref: caseRef,
        to_bureau_id: "bureau-stu",
        reason: "Unauthorized reassign",
      }),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_ROLE_PERMISSIONS",
    });
  });

  it("escalates surveillance level and records audit event", async () => {
    await switchRole("SUPERVISOR");
    const targetRef = "AICTE-2026-00006";
    const initial = await getCase(targetRef);

    const updated = await escalateCase({
      case_ref: targetRef,
      reason: "Repeated inquiry notice ignored by institution administration.",
    });

    expect(updated.escalation_level).toBe(Math.min(initial.escalation_level + 1, 2));

    const timeline = await getTimeline(targetRef);
    const escalationEvent = timeline.find((t) => t.event_type === "ESCALATED");
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.remark).toContain("Repeated inquiry notice");
  });

  it("enforces mandatory remarks on status transition", async () => {
    await switchRole("ADMIN");
    // Find an Assigned or In Progress case
    const cases = await getCase("AICTE-2026-00001");

    await expect(
      transitionCase({
        case_ref: cases.case_reference_id,
        to_status: "Resolved",
        remarks: "", // empty remarks
      }),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/MISSING_REMARKS|INVALID_STATE_TRANSITION/),
    });
  });
});
