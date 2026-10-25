import { describe, expect, it } from "vitest";
import {
  getSlaRadar,
  getBureaus,
  escalateCase,
  switchRole,
  getCase,
  getTimeline,
} from "@/api/index";

describe("Step 4: SLA Radar & Surveillance", () => {
  it("calculates accurate SLA radar metrics for consolidated bureaus", async () => {
    await switchRole("ADMIN");
    const summary = await getSlaRadar();

    expect(summary.total_active_cases).toBeGreaterThan(0);
    expect(summary.overdue_count).toBeGreaterThan(0);
    expect(summary.approaching_count).toBeGreaterThanOrEqual(0);
    expect(summary.on_track_count).toBeGreaterThan(0);

    // Sum of active buckets equals total_active_cases
    expect(
      summary.overdue_count + summary.approaching_count + summary.on_track_count,
    ).toBe(summary.total_active_cases);

    // Verify overdue items shape
    expect(summary.overdue_cases.length).toBe(summary.overdue_count);
    const firstOverdue = summary.overdue_cases[0];
    expect(firstOverdue.case_reference_id).toMatch(/^AICTE-\d{4}-\d{5}$/);
    expect(firstOverdue.is_overdue).toBe(true);
    expect(firstOverdue.sla_status).toBe("OVERDUE");
    expect(firstOverdue.hours_remaining).not.toBeNull();

    // Verify approaching items shape
    expect(summary.approaching_cases.length).toBe(summary.approaching_count);
    if (summary.approaching_cases.length > 0) {
      const firstApproaching = summary.approaching_cases[0]!;
      expect(firstApproaching.case_reference_id).toMatch(/^AICTE-\d{4}-\d{5}$/);
      expect(firstApproaching.sla_status).toBe("APPROACHING");
      expect(firstApproaching.due_date).toBeTruthy();
    }
  });

  it("filters SLA radar metrics when a specific bureau is selected", async () => {
    await switchRole("ADMIN");
    const bureaus = await getBureaus();
    expect(bureaus.length).toBeGreaterThan(0);

    const targetBureau = bureaus[0];
    const filtered = await getSlaRadar(targetBureau.id);

    // All returned items must belong to the chosen bureau
    filtered.overdue_cases.forEach((item) => {
      expect(item.bureau_code).toBe(targetBureau.code);
    });

    filtered.approaching_cases.forEach((item) => {
      expect(item.bureau_code).toBe(targetBureau.code);
    });
  });

  it("enforces bureau scoping on SLA radar for OFFICER role", async () => {
    // Switch to OFFICER role with bureau bureau-appr (APPR)
    await switchRole("OFFICER", "bureau-appr");
    const summary = await getSlaRadar();

    // Officer must only see their bureau's overdue & approaching cases
    summary.overdue_cases.forEach((c) => {
      expect(c.bureau_code).toBe("APPR");
    });
    summary.approaching_cases.forEach((c) => {
      expect(c.bureau_code).toBe("APPR");
    });
  });

  it("escalates an overdue case up to Tier 1 and Tier 2 surveillance", async () => {
    await switchRole("SUPERVISOR");
    const summary = await getSlaRadar();
    expect(summary.overdue_cases.length).toBeGreaterThan(0);

    // Pick an unescalated overdue case
    const target = summary.overdue_cases.find((c) => c.escalation_level === 0) || summary.overdue_cases[0];
    const initialTier = target.escalation_level;

    if (initialTier < 2) {
      const escalated = await escalateCase({
        case_ref: target.case_reference_id,
        reason: "Critical SLA breach: escalating to supervisory surveillance desk.",
      });

      expect(escalated.escalation_level).toBe(initialTier + 1);

      // Verify audit timeline entry exists for escalation
      const timeline = await getTimeline(target.case_reference_id);
      const escalationEvent = timeline.find((e) => e.event_type === "ESCALATED");
      expect(escalationEvent).toBeDefined();
      expect(escalationEvent?.actor_role).toBe("SUPERVISOR");
    }
  });

  it("blocks escalation attempts from OFFICER and AUDITOR roles", async () => {
    const caseRef = "AICTE-2026-00001";

    // Officer role should be blocked
    await switchRole("OFFICER", "bureau-appr");
    await expect(
      escalateCase({
        case_ref: caseRef,
        reason: "Unauthorized officer escalation attempt.",
      }),
    ).rejects.toThrow();

    // Auditor role should be blocked
    await switchRole("AUDITOR");
    await expect(
      escalateCase({
        case_ref: caseRef,
        reason: "Auditor cannot mutate case state.",
      }),
    ).rejects.toThrow();
  });
});
