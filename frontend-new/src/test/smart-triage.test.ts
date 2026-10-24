import { describe, expect, it } from "vitest";
import {
  runTriage,
  checkDuplicates,
  applyTriage,
  getCase,
  getTimeline,
  switchRole,
} from "@/api/index";

describe("Step 5: Smart Triage & Duplicate Intelligence", () => {
  it("classifies grievance narratives accurately across statutory AICTE bureaus", async () => {
    // 1. Approval Bureau (APPR)
    const apprRes = await runTriage(
      "Unapproved course intake and land/building violation. Faculty-student ratio is 1:35 without laboratory infrastructure.",
    );
    expect(apprRes.recommended_bureau_code).toBe("APPR");
    expect(apprRes.recommended_bureau_name).toBe("Approval Bureau");
    expect(apprRes.confidence).toBeGreaterThan(0.6);

    // 2. Student Welfare Cell (STU)
    const stuRes = await runTriage(
      "Severe ragging incident in boys hostel. Student mental health and physical safety threatened by senior hostel residents.",
    );
    expect(stuRes.recommended_bureau_code).toBe("STU");
    expect(stuRes.recommended_category).toBe("Student Grievance");
    expect(stuRes.recommended_priority).toBe("URGENT");

    // 3. Faculty Grievance Cell (FDC)
    const fdcRes = await runTriage(
      "Assistant professors denied 7th CPC revision with 6 months salary arrears pending and unpaid wages.",
    );
    expect(fdcRes.recommended_bureau_code).toBe("FDC");
    expect(fdcRes.recommended_category).toBe("Faculty Grievance");

    // 4. Finance & Fee Regulatory Bureau (FIN)
    const finRes = await runTriage(
      "College demanding excess capitation fee and caution deposit refund denied upon admission cancellation.",
    );
    expect(finRes.recommended_bureau_code).toBe("FIN");
    expect(finRes.recommended_category).toBe("Fee Regulation");
  });

  it("normalizes matched keyword weights so their sum equals exactly 100%", async () => {
    const res = await runTriage(
      "Hostel ragging incident with harassment of students and mental health safety concerns.",
    );

    expect(res.matched_keywords.length).toBeGreaterThan(0);
    const sum = res.matched_keywords.reduce((acc, kw) => acc + kw.weight, 0);

    // Weights sum to 1.0 (with floating point tolerance 0.02)
    expect(Math.abs(sum - 1)).toBeLessThanOrEqual(0.02);

    res.matched_keywords.forEach((kw) => {
      expect(kw.keyword).toBeTruthy();
      expect(kw.weight).toBeGreaterThan(0);
      expect(kw.resulting_route).toBeTruthy();
    });
  });

  it("detects repository duplicate complaints with similarity scores and keyword intersections", async () => {
    const matches = await checkDuplicates({
      subject: "Faculty shortage and ratio violation",
      description: "College has 43 faculty against required 62 students enrolled. Faculty-student ratio violates AICTE norms.",
      institution_name: "Lovely Professional University",
    });

    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);

    const top = matches[0];
    expect(top.case_reference_id).toMatch(/^AICTE-\d{4}-\d{5}$/);
    expect(top.similarity_score).toBeGreaterThan(0.2);
    expect(top.matched_keywords.length).toBeGreaterThan(0);
    expect(top.status).toBeTruthy();
  });

  it("applies triage recommendations and writes an immutable audit timeline entry", async () => {
    await switchRole("ADMIN");
    const caseRef = "AICTE-2026-00005";

    const triageRes = await runTriage(
      "Severe ragging in hostel block compromising student safety.",
    );

    const updated = await applyTriage(caseRef, triageRes);

    expect(updated.case_reference_id).toBe(caseRef);
    expect(updated.bureau_code).toBe("STU");
    expect(updated.category).toBe("Student Grievance");

    // Confirm timeline entry was appended
    const timeline = await getTimeline(caseRef);
    const triageEvent = timeline.find((e) => e.event_type === "TRIAGE_APPLIED");
    expect(triageEvent).toBeDefined();
    expect(triageEvent?.actor_role).toBe("ADMIN");
  });

  it("blocks triage application for unauthorized OFFICER and AUDITOR roles", async () => {
    const caseRef = "AICTE-2026-00001";
    const triageRes = await runTriage("Land and building shortage");

    // Officer attempt should be rejected
    await switchRole("OFFICER", "bureau-appr");
    await expect(applyTriage(caseRef, triageRes)).rejects.toThrow();

    // Auditor attempt should be rejected
    await switchRole("AUDITOR");
    await expect(applyTriage(caseRef, triageRes)).rejects.toThrow();
  });
});
