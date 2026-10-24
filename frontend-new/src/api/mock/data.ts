/**
 * Deterministic mock seed data for 58 complaint cases.
 * Distribution: APPR=22, STU=14, FDC=11, FIN=11
 * SLA: 8 Overdue, 9 Approaching, 27 On Track; 14 Resolved/Closed
 */

import type { Bureau, Officer, ComplaintCase, CaseStatus, CasePriority } from "@/types/ui";

// ─── Bureaus ──────────────────────────────────────────────────────────────────

export const MOCK_BUREAUS: Bureau[] = [
  {
    id: "bureau-appr",
    code: "APPR",
    name: "Approval Bureau",
    description: "Monitors institutional compliance with AICTE approval norms, land, building, and faculty ratios.",
    is_active: true,
  },
  {
    id: "bureau-stu",
    code: "STU",
    name: "Student Welfare Cell",
    description: "Addresses grievances regarding ragging, student safety, mental health, and hostel amenities.",
    is_active: true,
  },
  {
    id: "bureau-fdc",
    code: "FDC",
    name: "Faculty Grievance Cell",
    description: "Reviews faculty complaints regarding salary arrears, 7th CPC non-implementation, and termination.",
    is_active: true,
  },
  {
    id: "bureau-fin",
    code: "FIN",
    name: "Finance & Fee Regulatory Bureau",
    description: "Oversees capitation fee complaints, excess tuition demands, and security deposit withholding.",
    is_active: true,
  },
];

// ─── Officers ─────────────────────────────────────────────────────────────────

export const MOCK_OFFICERS: Officer[] = [
  { id: "officer-appr-1", email: "officer.appr@aicte-demo.gov.in", full_name: "Shri Arvind Verma", role: "OFFICER" },
  { id: "officer-stu-1",  email: "officer.stu@aicte-demo.gov.in",  full_name: "Dr. Priya Nair",    role: "OFFICER" },
  { id: "officer-fdc-1",  email: "officer.fdc@aicte-demo.gov.in",  full_name: "Prof. Manoj Joshi", role: "OFFICER" },
  { id: "officer-fin-1",  email: "officer.fin@aicte-demo.gov.in",  full_name: "Shri Deepesh Goyal",role: "OFFICER" },
];

export const BUREAU_OFFICERS: Record<string, Officer[]> = {
  "bureau-appr": [MOCK_OFFICERS[0]],
  "bureau-stu":  [MOCK_OFFICERS[1]],
  "bureau-fdc":  [MOCK_OFFICERS[2]],
  "bureau-fin":  [MOCK_OFFICERS[3]],
};

// ─── Institutions ─────────────────────────────────────────────────────────────

const INSTITUTIONS = [
  { id: "inst-01", aicte_id: "1-3324561", name: "Rajasthan Technical University",             state: "Rajasthan",      district: "Kota" },
  { id: "inst-02", aicte_id: "1-4521890", name: "Symbiosis Institute of Technology",          state: "Maharashtra",    district: "Pune" },
  { id: "inst-03", aicte_id: "1-2893421", name: "Amity University Noida",                     state: "Uttar Pradesh",  district: "Noida" },
  { id: "inst-04", aicte_id: "2-7654321", name: "Chandigarh University",                      state: "Punjab",         district: "Mohali" },
  { id: "inst-05", aicte_id: "1-5643210", name: "VIT University Chennai",                     state: "Tamil Nadu",     district: "Chennai" },
  { id: "inst-06", aicte_id: "1-8765432", name: "NMIMS Mumbai School of Engineering",         state: "Maharashtra",    district: "Mumbai" },
  { id: "inst-07", aicte_id: "2-3456789", name: "Manipal Institute of Technology",            state: "Karnataka",      district: "Udupi" },
  { id: "inst-08", aicte_id: "1-6789012", name: "Lovely Professional University",             state: "Punjab",         district: "Phagwara" },
  { id: "inst-09", aicte_id: "1-9876543", name: "SRM Institute of Science and Technology",   state: "Tamil Nadu",     district: "Kancheepuram" },
  { id: "inst-10", aicte_id: "2-1234567", name: "Dayananda Sagar University",                 state: "Karnataka",      district: "Bengaluru" },
  { id: "inst-11", aicte_id: "1-7654321", name: "PSG College of Technology",                  state: "Tamil Nadu",     district: "Coimbatore" },
  { id: "inst-12", aicte_id: "1-4567890", name: "Kalinga Institute of Industrial Technology", state: "Odisha",         district: "Bhubaneswar" },
  { id: "inst-13", aicte_id: "2-8901234", name: "BMS College of Engineering",                 state: "Karnataka",      district: "Bengaluru" },
  { id: "inst-14", aicte_id: "2-2345678", name: "RNS Institute of Technology",               state: "Karnataka",      district: "Bengaluru" },
  { id: "inst-15", aicte_id: "1-5678901", name: "KLE Technological University",               state: "Karnataka",      district: "Hubballi" },
];

// ─── Case templates per bureau ────────────────────────────────────────────────

interface CaseTemplate {
  subject: string;
  category: string;
  priority: CasePriority;
  description: string;
}

const TEMPLATES: Record<string, CaseTemplate[]> = {
  APPR: [
    { subject: "Faculty shortage below AICTE prescribed ratio", category: "Faculty Compliance", priority: "HIGH",
      description: "Institution has 43 faculty against required 62 for enrolled strength of 1240 students. Faculty-student ratio of 1:29 violates AICTE norms." },
    { subject: "Land ownership documents not submitted for approval renewal", category: "Approval Documentation", priority: "MEDIUM",
      description: "Renewal application submitted without land mutation certificate. Required for approval of Phase 3 expansion of campus." },
    { subject: "NBA accreditation lapse — courses running without valid accreditation", category: "NBA Accreditation", priority: "URGENT",
      description: "B.Tech CSE and ECE programmes running post-accreditation expiry date without renewal application filed." },
    { subject: "Excess intake against sanctioned strength in B.Tech programme", category: "Intake Violation", priority: "HIGH",
      description: "Institution admitted 180 students against sanctioned intake of 120 in B.Tech Mechanical Engineering 2025-26." },
    { subject: "Building plan deviation from approved layout", category: "Infrastructure Compliance", priority: "MEDIUM",
      description: "New academic block constructed without approved building plan. Deviation of 2400 sq ft from approved FAR." },
    { subject: "Non-submission of annual compliance report", category: "Approval Documentation", priority: "LOW",
      description: "Annual compliance report for 2024-25 not submitted within stipulated date of 30 September 2025." },
    { subject: "Inadequate laboratory infrastructure for engineering programmes", category: "Infrastructure Compliance", priority: "MEDIUM",
      description: "Laboratory space per student below 2.5 sq m norm for Chemical Engineering department. Inspection report attached." },
  ],
  STU: [
    { subject: "Ragging complaint by first-year B.Tech students", category: "Ragging", priority: "URGENT",
      description: "Three first-year students report ragging by seniors in hostel Block C. Incident occurred on 12 October 2026. Formal complaint filed with anti-ragging committee." },
    { subject: "Hostel food quality and hygiene standards not maintained", category: "Hostel Facilities", priority: "HIGH",
      description: "Students report repeated supply of stale food in mess. Water supply disrupted for 3 consecutive days. Photographic evidence submitted." },
    { subject: "Mental health counsellor post vacant for 8 months", category: "Mental Health", priority: "HIGH",
      description: "AICTE mandated counsellor post vacant since February 2026. Students unable to access mental health support services on campus." },
    { subject: "Scholarship disbursement delayed by 6 months", category: "Scholarship", priority: "MEDIUM",
      description: "Post-Matric scholarship amounts for 2025-26 not disbursed to 240 eligible students despite successful verification by state nodal officer." },
    { subject: "Student safety concerns — boundary wall collapsed", category: "Student Safety", priority: "URGENT",
      description: "Boundary wall of girls hostel partially collapsed after heavy rainfall. Structural safety report not shared with students or guardians." },
  ],
  FDC: [
    { subject: "Salary arrears pending for 14 months", category: "Salary Grievance", priority: "URGENT",
      description: "Faculty member reports salary dues of Rs 4.2 lakh pending since August 2025. PF deductions made but not deposited with EPFO." },
    { subject: "7th CPC pay revision not implemented", category: "Pay Revision", priority: "HIGH",
      description: "Institution refuses to implement 7th Central Pay Commission recommendations for teaching staff. Arrears since January 2016 not paid." },
    { subject: "Arbitrary termination without due process", category: "Service Matter", priority: "HIGH",
      description: "Associate Professor terminated via letter on 1 October 2026 without show-cause notice, departmental inquiry, or compensation as per UGC regulations." },
    { subject: "PF contributions deducted but not deposited", category: "PF Compliance", priority: "URGENT",
      description: "Employee Provident Fund deducted from salaries of 45 faculty for 18 months but not remitted to EPFO. EPFO passbook shows zero balance." },
    { subject: "Medical leave denied despite doctor certificate", category: "Leave Entitlement", priority: "MEDIUM",
      description: "Faculty member denied 10 days medical leave despite submission of registered medical practitioner certificate and AICTE entitlement of 8 days." },
  ],
  FIN: [
    { subject: "Capitation fee collected at time of admission", category: "Capitation Fee", priority: "URGENT",
      description: "Institution collected Rs 1.5 lakh as 'development fee' at admission in addition to approved tuition fee. Receipts not issued for collection." },
    { subject: "Excess tuition fee charged beyond approved fee structure", category: "Fee Overcharge", priority: "HIGH",
      description: "Approved annual fee: Rs 85,000. Collected: Rs 1,12,000. Difference of Rs 27,000 per student charged as 'miscellaneous head' without approval." },
    { subject: "Security deposit withheld after course completion", category: "Refund Non-compliance", priority: "HIGH",
      description: "Security deposit of Rs 25,000 not refunded to 89 graduated students despite repeated requests and 6 months post-graduation." },
    { subject: "Online fee payment portal charging additional processing fee", category: "Fee Regulation", priority: "MEDIUM",
      description: "Institution's online payment portal charges 2.5% processing fee not mentioned in fee structure approved by state fee committee." },
    { subject: "Duplicate admission receipt fraud", category: "Fee Fraud", priority: "URGENT",
      description: "Students report being given handwritten receipts instead of official system-generated ones. Cash collected not entered into accounts." },
  ],
};

// ─── Generator ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-10-24T10:00:00Z");

function iso(d: Date) { return d.toISOString(); }
function hoursAgo(h: number) { return new Date(NOW.getTime() - h * 3600 * 1000); }
function hoursFromNow(h: number) { return new Date(NOW.getTime() + h * 3600 * 1000); }
function daysAgo(d: number) { return hoursAgo(d * 24); }

type SlaBucket = "overdue" | "approaching" | "on_track" | "resolved" | "closed";

interface CaseSpec {
  bureauId: string;
  bureauCode: "APPR" | "STU" | "FDC" | "FIN";
  instIdx: number;
  templateIdx: number;
  status: CaseStatus;
  sla: SlaBucket;
}

// Build the 58 cases spec: APPR=22, STU=14, FDC=11, FIN=11
function buildSpecs(): CaseSpec[] {
  const specs: CaseSpec[] = [];

  const bureaus: Array<{ id: string; code: "APPR" | "STU" | "FDC" | "FIN"; count: number; templates: number }> = [
    { id: "bureau-appr", code: "APPR", count: 22, templates: 7 },
    { id: "bureau-stu",  code: "STU",  count: 14, templates: 5 },
    { id: "bureau-fdc",  code: "FDC",  count: 11, templates: 5 },
    { id: "bureau-fin",  code: "FIN",  count: 11, templates: 5 },
  ];

  // SLA distribution across 58: 8 overdue, 9 approaching, 27 on_track, 10 resolved, 4 closed
  const slaBuckets: SlaBucket[] = [
    ...Array(8).fill("overdue"),
    ...Array(9).fill("approaching"),
    ...Array(27).fill("on_track"),
    ...Array(10).fill("resolved"),
    ...Array(4).fill("closed"),
  ];

  // Status for each SLA bucket
  const STATUS_FOR_SLA: Record<SlaBucket, CaseStatus[]> = {
    overdue:    ["In Progress", "Awaiting Information", "Under Review", "Assigned"],
    approaching:["In Progress", "Assigned", "Under Triage", "Awaiting Information"],
    on_track:   ["Received", "Registered", "Under Triage", "Assigned", "In Progress", "Under Review"],
    resolved:   ["Resolved"],
    closed:     ["Closed"],
  };

  let caseIndex = 0;
  for (const bureau of bureaus) {
    for (let i = 0; i < bureau.count; i++) {
      const sla = slaBuckets[caseIndex % slaBuckets.length];
      const statusOptions = STATUS_FOR_SLA[sla];
      const status = statusOptions[i % statusOptions.length];
      specs.push({
        bureauId: bureau.id,
        bureauCode: bureau.code,
        instIdx: (caseIndex * 3 + 7) % 15,  // deterministic spread across institutions
        templateIdx: i % TEMPLATES[bureau.code].length,
        status,
        sla,
      });
      caseIndex++;
    }
  }

  return specs;
}

// ─── Officer lookup ───────────────────────────────────────────────────────────

const OFFICER_FOR_BUREAU: Record<string, { id: string; name: string }> = {
  "bureau-appr": { id: "officer-appr-1", name: "Shri Arvind Verma" },
  "bureau-stu":  { id: "officer-stu-1",  name: "Dr. Priya Nair" },
  "bureau-fdc":  { id: "officer-fdc-1",  name: "Prof. Manoj Joshi" },
  "bureau-fin":  { id: "officer-fin-1",  name: "Shri Deepesh Goyal" },
};

const UNASSIGNED_STATUSES: CaseStatus[] = ["Received", "Registered"];

// ─── Case factory ─────────────────────────────────────────────────────────────

export function generateMockCases(): ComplaintCase[] {
  const specs = buildSpecs();
  const cases: ComplaintCase[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const inst = INSTITUTIONS[spec.instIdx];
    const tmpl = TEMPLATES[spec.bureauCode][spec.templateIdx];
    const officer = OFFICER_FOR_BUREAU[spec.bureauId];

    const ref = `AICTE-2026-${String(i + 1).padStart(5, "0")}`;
    const caseId = `case-${String(i + 1).padStart(4, "0")}`;

    const isAssigned = !UNASSIGNED_STATUSES.includes(spec.status);
    const isResolved = spec.status === "Resolved" || spec.status === "Closed";

    let createdAt: Date;
    let dueDate: Date;
    let escalationLevel: number;
    let resolvedAt: Date | null = null;
    let closedAt: Date | null = null;

    switch (spec.sla) {
      case "overdue":
        createdAt = daysAgo(12);
        dueDate = hoursAgo(24 + (i % 72)); // 24–96h overdue
        escalationLevel = 2;
        break;
      case "approaching":
        createdAt = daysAgo(4);
        dueDate = hoursFromNow(4 + (i % 44)); // 4–48h remaining
        escalationLevel = 1;
        break;
      case "on_track":
        createdAt = daysAgo(2 + (i % 8));
        dueDate = hoursFromNow(72 + (i % 120));
        escalationLevel = 0;
        break;
      case "resolved":
        createdAt = daysAgo(15 + (i % 10));
        dueDate = hoursFromNow(48); // was on track
        escalationLevel = 0;
        resolvedAt = daysAgo(2);
        break;
      case "closed":
      default:
        createdAt = daysAgo(20 + (i % 15));
        dueDate = hoursFromNow(48);
        escalationLevel = 0;
        resolvedAt = daysAgo(5);
        closedAt = daysAgo(4);
        break;
    }

    cases.push({
      id: caseId,
      case_reference_id: ref,
      institution_id: inst.id,
      institution_name: inst.name,
      aicte_permanent_id: inst.aicte_id,
      bureau_id: spec.bureauId,
      bureau_code: spec.bureauCode,
      bureau_name: MOCK_BUREAUS.find((b) => b.id === spec.bureauId)!.name,
      assigned_officer_id: isAssigned ? officer.id : undefined,
      assigned_officer_name: isAssigned ? officer.name : undefined,
      subject: tmpl.subject,
      description_redacted: tmpl.description,
      description_confidential: `[CONFIDENTIAL]: Complainant identity protected. Statement filed against administration of ${inst.name}.`,
      category: tmpl.category,
      priority: tmpl.priority,
      status: spec.status,
      due_date: iso(dueDate),
      escalation_level: escalationLevel,
      created_at: iso(createdAt),
      updated_at: iso(new Date(createdAt.getTime() + 2 * 3600 * 1000)),
      resolved_at: resolvedAt ? iso(resolvedAt) : null,
      closed_at: closedAt ? iso(closedAt) : null,
      closure_remarks: isResolved
        ? "Grievance resolved following institutional compliance and confirmation of corrective action."
        : null,
    });
  }

  return cases;
}

export const INITIAL_CASES: ComplaintCase[] = generateMockCases();
