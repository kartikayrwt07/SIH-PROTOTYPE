import { describe, expect, it } from "vitest";
import {
  adaptCase,
  adaptTimeline,
  adaptNote,
  adaptBureaus,
} from "@/api/adapters";
import type {
  RawComplaintCase,
  RawTimelineEvent,
  RawCaseNote,
  RawBureau,
} from "@/types/api";

describe("API Adapters", () => {
  it("flattens nested RawComplaintCase into UI ComplaintCase", () => {
    const raw: RawComplaintCase = {
      id: "case-123",
      case_reference_id: "AICTE-2026-00001",
      institution_id: "inst-456",
      bureau_id: "bur-789",
      assigned_officer_id: "usr-001",
      complainant_identity_id: "id-1",
      complainant_verification_badge: null,
      subject: "Test Grievance",
      description_redacted: "Safe public summary",
      description_confidential: "Confidential statement",
      category: "Faculty",
      priority: "HIGH",
      status: "In Progress",
      due_date: "2026-11-01T00:00:00Z",
      escalation_level: 1,
      closure_remarks: null,
      created_at: "2026-10-24T00:00:00Z",
      updated_at: "2026-10-24T06:00:00Z",
      resolved_at: null,
      closed_at: null,
      institution: {
        id: "inst-456",
        aicte_permanent_id: "1-3324561",
        name: "Test University",
        state: "Rajasthan",
        district: "Kota",
        institution_type: "Govt",
      },
      bureau: {
        id: "bur-789",
        code: "APPR",
        name: "Approval Bureau",
        description: "Monitors approvals",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      assigned_officer: {
        id: "usr-001",
        email: "officer@aicte.gov.in",
        full_name: "Shri Officer",
        role: "OFFICER",
      },
    };

    const adapted = adaptCase(raw);

    expect(adapted.id).toBe("case-123");
    expect(adapted.case_reference_id).toBe("AICTE-2026-00001");
    expect(adapted.institution_name).toBe("Test University");
    expect(adapted.aicte_permanent_id).toBe("1-3324561");
    expect(adapted.bureau_code).toBe("APPR");
    expect(adapted.bureau_name).toBe("Approval Bureau");
    expect(adapted.assigned_officer_name).toBe("Shri Officer");
    expect(adapted.priority).toBe("HIGH");
    expect(adapted.status).toBe("In Progress");
  });

  it("handles missing nested relations gracefully with fallbacks", () => {
    const raw: RawComplaintCase = {
      id: "case-empty-rel",
      case_reference_id: "AICTE-2026-00002",
      institution_id: "inst-missing",
      bureau_id: "bur-missing",
      assigned_officer_id: null,
      complainant_identity_id: null,
      complainant_verification_badge: null,
      subject: "No relations case",
      description_redacted: "Summary",
      description_confidential: null,
      category: "General",
      priority: "LOW",
      status: "Received",
      due_date: null,
      escalation_level: 0,
      closure_remarks: null,
      created_at: "2026-10-24T00:00:00Z",
      updated_at: "2026-10-24T00:00:00Z",
      resolved_at: null,
      closed_at: null,
      institution: null,
      bureau: null,
      assigned_officer: null,
    };

    const adapted = adaptCase(raw);

    expect(adapted.institution_name).toBe("(unknown institution)");
    expect(adapted.aicte_permanent_id).toBe("");
    expect(adapted.bureau_name).toBe("");
    expect(adapted.assigned_officer_name).toBeUndefined();
  });

  it("extracts remarks from timeline event metadata", () => {
    const event: RawTimelineEvent = {
      id: "tl-1",
      case_id: "case-1",
      actor_id: "u-1",
      actor_role: "SUPERVISOR",
      actor_name: "Dr. Chandra",
      event_type: "STATUS_CHANGE",
      previous_state: "Received",
      new_state: "Registered",
      metadata_json: { remarks: "Registration approved by supervisor" },
      timestamp: "2026-10-24T01:00:00Z",
    };

    const adapted = adaptTimeline(event);
    expect(adapted.remark).toBe("Registration approved by supervisor");
    expect(adapted.event_type).toBe("STATUS_CHANGE");
    expect(adapted.actor_role).toBe("SUPERVISOR");
  });

  it("adapts case notes with author summary", () => {
    const rawNote: RawCaseNote = {
      id: "note-1",
      case_id: "c-1",
      author_id: "u-1",
      content: "Formal notice dispatched",
      is_confidential: false,
      created_at: "2026-10-24T02:00:00Z",
      author: {
        id: "u-1",
        email: "officer@aicte.gov.in",
        full_name: "Shri Verma",
        role: "OFFICER",
      },
    };

    const adapted = adaptNote(rawNote);
    expect(adapted.content).toBe("Formal notice dispatched");
    expect(adapted.author_name).toBe("Shri Verma");
    expect(adapted.author_role).toBe("OFFICER");
    expect(adapted.is_confidential).toBe(false);
  });

  it("adapts bureaus correctly", () => {
    const rawBureaus: RawBureau[] = [
      {
        id: "b-1",
        code: "APPR",
        name: "Approval Bureau",
        description: "Desc",
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "b-2",
        code: "STU",
        name: "Student Welfare Cell",
        description: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
    ];

    const adapted = adaptBureaus(rawBureaus);
    expect(adapted).toHaveLength(2);
    expect(adapted[0].code).toBe("APPR");
    expect(adapted[1].code).toBe("STU");
  });
});
