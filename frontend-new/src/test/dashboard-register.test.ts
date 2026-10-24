import { describe, expect, it } from "vitest";
import {
  getDashboardStats,
  listCases,
  switchRole,
} from "@/api/index";
import { deriveSlaStatus, formatRemainingTime } from "@/components/cases/SlaPill";

describe("Step 2: Dashboard & Case Register", () => {
  it("computes accurate KPIs for the 58 seeded cases", async () => {
    await switchRole("ADMIN");
    const stats = await getDashboardStats();

    expect(stats.total_cases).toBe(58);
    expect(stats.resolved_cases + stats.closed_cases).toBe(14);
    expect(stats.active_cases).toBe(44);
    expect(stats.overdue_cases).toBe(8);
    expect(stats.approaching_cases).toBe(9);
    expect(stats.on_track_cases).toBe(27);
    expect(stats.resolution_rate).toBeCloseTo(14 / 58, 2);
  });

  it("provides bureau breakdown across all 4 bureaus", async () => {
    await switchRole("SUPERVISOR");
    const stats = await getDashboardStats();

    expect(stats.bureau_breakdown).toHaveLength(4);
    const codes = stats.bureau_breakdown.map((b) => b.bureau_code);
    expect(codes).toContain("APPR");
    expect(codes).toContain("STU");
    expect(codes).toContain("FDC");
    expect(codes).toContain("FIN");

    const appr = stats.bureau_breakdown.find((b) => b.bureau_code === "APPR");
    expect(appr?.total).toBe(22);
  });

  it("filters case register by status", async () => {
    await switchRole("ADMIN");
    const res = await listCases({ status: "Under Review" });
    expect(res.items.length).toBeGreaterThan(0);
    res.items.forEach((c) => {
      expect(c.status).toBe("Under Review");
    });
  });

  it("filters case register by priority", async () => {
    await switchRole("ADMIN");
    const res = await listCases({ priority: "URGENT" });
    expect(res.items.length).toBeGreaterThan(0);
    res.items.forEach((c) => {
      expect(c.priority).toBe("URGENT");
    });
  });

  it("supports text search across subject, institution, and reference ID", async () => {
    await switchRole("ADMIN");
    const res = await listCases({ search: "ragging" });
    expect(res.items.length).toBeGreaterThan(0);
    res.items.forEach((c) => {
      const match =
        c.subject.toLowerCase().includes("ragging") ||
        c.category.toLowerCase().includes("ragging") ||
        c.institution_name.toLowerCase().includes("ragging");
      expect(match).toBe(true);
    });
  });

  it("paginates cases properly (10, 25, 50)", async () => {
    await switchRole("ADMIN");
    const page1 = await listCases({ page: 1, page_size: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(58);
    expect(page1.total_pages).toBe(6);

    const page2 = await listCases({ page: 2, page_size: 10 });
    expect(page2.items).toHaveLength(10);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);

    const largePage = await listCases({ page: 1, page_size: 50 });
    expect(largePage.items).toHaveLength(50);
  });

  it("derives SLA status from due dates accurately", () => {
    const now = Date.now();
    const past = new Date(now - 12 * 3600 * 1000).toISOString();
    const overdue = deriveSlaStatus(past);
    expect(overdue.status).toBe("OVERDUE");
    expect(overdue.hoursRemaining).toBeLessThan(0);

    const near = new Date(now + 24 * 3600 * 1000).toISOString();
    const approaching = deriveSlaStatus(near);
    expect(approaching.status).toBe("APPROACHING");
    expect(approaching.hoursRemaining).toBeGreaterThan(0);
    expect(approaching.hoursRemaining).toBeLessThanOrEqual(48);

    const far = new Date(now + 96 * 3600 * 1000).toISOString();
    const onTrack = deriveSlaStatus(far);
    expect(onTrack.status).toBe("ON_TRACK");

    const resolved = deriveSlaStatus(past, true);
    expect(resolved.status).toBe("ON_TRACK");
  });

  it("formats remaining hours into readable strings", () => {
    expect(formatRemainingTime(-12)).toBe("12h overdue");
    expect(formatRemainingTime(-36)).toBe("1d 12h overdue");
    expect(formatRemainingTime(18)).toBe("18h left");
    expect(formatRemainingTime(72)).toBe("3d left");
  });
});
