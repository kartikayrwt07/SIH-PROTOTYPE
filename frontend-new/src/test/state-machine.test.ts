import { describe, expect, it } from "vitest";
import {
  canTransition,
  getAllowedTransitions,
  isTerminal,
  isActive,
  ALL_STATUSES,
} from "@/lib/stateMachine";

describe("State Machine transitions", () => {
  it("defines all 9 official AICTE complaint statuses", () => {
    expect(ALL_STATUSES).toHaveLength(9);
    expect(ALL_STATUSES).toEqual([
      "Received",
      "Registered",
      "Under Triage",
      "Assigned",
      "In Progress",
      "Awaiting Information",
      "Under Review",
      "Resolved",
      "Closed",
    ]);
  });

  it("permits legal initial transitions", () => {
    expect(canTransition("Received", "Registered")).toBe(true);
    expect(canTransition("Registered", "Under Triage")).toBe(true);
    expect(canTransition("Under Triage", "Assigned")).toBe(true);
    expect(canTransition("Assigned", "In Progress")).toBe(true);
  });

  it("handles bidirectional In Progress <-> Awaiting Information", () => {
    expect(canTransition("In Progress", "Awaiting Information")).toBe(true);
    expect(canTransition("Awaiting Information", "In Progress")).toBe(true);
  });

  it("handles resolution and reopening", () => {
    expect(canTransition("Under Review", "Resolved")).toBe(true);
    expect(canTransition("Resolved", "Closed")).toBe(true);
    // Reopen path
    expect(canTransition("Resolved", "In Progress")).toBe(true);
  });

  it("blocks illegal transitions", () => {
    expect(canTransition("Received", "Resolved")).toBe(false);
    expect(canTransition("Registered", "Closed")).toBe(false);
    expect(canTransition("Assigned", "Resolved")).toBe(false);
  });

  it("identifies Closed as terminal", () => {
    expect(isTerminal("Closed")).toBe(true);
    expect(getAllowedTransitions("Closed")).toHaveLength(0);
    expect(isTerminal("Resolved")).toBe(false);
  });

  it("correctly identifies active cases", () => {
    expect(isActive("Received")).toBe(true);
    expect(isActive("In Progress")).toBe(true);
    expect(isActive("Resolved")).toBe(false);
    expect(isActive("Closed")).toBe(false);
  });
});
