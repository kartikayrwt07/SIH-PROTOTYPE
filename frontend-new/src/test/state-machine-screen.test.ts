import { describe, expect, it } from "vitest";
import {
  ALL_STATUSES,
  ALLOWED_TRANSITIONS,
  TRANSITION_GUARD_RULES,
  canTransition,
  getAllowedTransitions,
  isTerminal,
  isActive,
} from "@/lib/stateMachine";

describe("Step 7: State Machine Graph & Guard Simulator", () => {
  it("enforces complete topology across all 9 statutory lifecycle states", () => {
    expect(ALL_STATUSES).toHaveLength(9);
    ALL_STATUSES.forEach((status) => {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
      expect(TRANSITION_GUARD_RULES[status]).toBeDefined();
      expect(TRANSITION_GUARD_RULES[status].length).toBeGreaterThan(0);
    });
  });

  it("verifies linear progression paths from Received to Resolved", () => {
    // 1. Received -> Registered
    expect(getAllowedTransitions("Received")).toEqual(["Registered"]);

    // 2. Registered -> Under Triage
    expect(getAllowedTransitions("Registered")).toEqual(["Under Triage"]);

    // 3. Under Triage -> Assigned
    expect(getAllowedTransitions("Under Triage")).toEqual(["Assigned"]);

    // 4. Assigned -> In Progress
    expect(getAllowedTransitions("Assigned")).toEqual(["In Progress"]);
  });

  it("verifies bidirectional evidence loop between In Progress and Awaiting Information", () => {
    expect(canTransition("In Progress", "Awaiting Information")).toBe(true);
    expect(canTransition("Awaiting Information", "In Progress")).toBe(true);

    // From In Progress to Under Review
    expect(canTransition("In Progress", "Under Review")).toBe(true);

    // Under Review can send back to In Progress for revision or advance to Resolved
    expect(getAllowedTransitions("Under Review")).toContain("In Progress");
    expect(getAllowedTransitions("Under Review")).toContain("Resolved");
  });

  it("verifies determination finality and reopening workflow", () => {
    // Resolved can advance to Closed (terminal) OR reopen to In Progress
    const resolvedNext = getAllowedTransitions("Resolved");
    expect(resolvedNext).toContain("Closed");
    expect(resolvedNext).toContain("In Progress");

    // Closed is completely terminal
    expect(isTerminal("Closed")).toBe(true);
    expect(getAllowedTransitions("Closed")).toHaveLength(0);
  });

  it("validates guard rules and blocks illegal jumps with simulation verification", () => {
    // Illegal jumps that should be blocked
    expect(canTransition("Received", "Resolved")).toBe(false);
    expect(canTransition("Received", "Closed")).toBe(false);
    expect(canTransition("Under Triage", "Closed")).toBe(false);
    expect(canTransition("Assigned", "Resolved")).toBe(false);
    expect(canTransition("Closed", "In Progress")).toBe(false);
    expect(canTransition("Closed", "Received")).toBe(false);

    // Active status check
    expect(isActive("Received")).toBe(true);
    expect(isActive("In Progress")).toBe(true);
    expect(isActive("Resolved")).toBe(false);
    expect(isActive("Closed")).toBe(false);
  });
});
