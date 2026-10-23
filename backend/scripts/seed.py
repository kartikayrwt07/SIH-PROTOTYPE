"""Database Seeder Script for AICTE Integrated Complaint Dashboard.

Generates realistic but entirely synthetic data for demonstration:
- 4 Illustrative Bureaus
- 4 Role-specific Demo Users
- 5 Standard SLA Policies
- 15 Synthetic Indian Technical Institutions
- 58 Diverse Complaint Cases spanning all 9 lifecycle states
- Associated CaseAssignmentHistory and CaseAuditEvent rows
"""

import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models import (
    Bureau,
    User,
    UserRole,
    Institution,
    ComplaintCase,
    CaseStatus,
    CasePriority,
    SLAPolicy,
    CaseAssignmentHistory,
    CaseNote,
    CaseAuditEvent,
    AuditEventType,
)


def seed_database(db: Session = None):
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # Check if already seeded
        if db.query(Bureau).count() > 0:
            print("Database already contains data. Cleaning up before fresh seed...")
            db.query(CaseAuditEvent).delete()
            db.query(CaseAssignmentHistory).delete()
            db.query(CaseNote).delete()
            db.query(ComplaintCase).delete()
            db.query(User).delete()
            db.query(Institution).delete()
            db.query(SLAPolicy).delete()
            db.query(Bureau).delete()
            db.commit()

        print("Seeding Illustrative Bureaus...")
        bureaus_data = [
            {
                "code": "APPR",
                "name": "Approval Bureau",
                "description": "Monitors institutional compliance with AICTE approval norms, land, building, and faculty ratios."
            },
            {
                "code": "STU",
                "name": "Student Welfare Cell",
                "description": "Addresses grievances regarding ragging, student safety, mental health, and hostel amenities."
            },
            {
                "code": "FDC",
                "name": "Faculty Grievance Cell",
                "description": "Reviews faculty complaints regarding salary arrears, 7th CPC non-implementation, and termination."
            },
            {
                "code": "FIN",
                "name": "Finance & Fee Regulatory Bureau",
                "description": "Oversees capitation fee complaints, excess tuition demands, and security deposit withholding."
            },
        ]
        bureau_map = {}
        for b_data in bureaus_data:
            bureau = Bureau(**b_data)
            db.add(bureau)
            bureau_map[b_data["code"]] = bureau
        db.flush()

        print("Seeding Demo Users...")
        users_data = [
            {
                "email": "admin@aicte-demo.gov.in",
                "full_name": "Smt. Sunita Sharma (Admin)",
                "role": UserRole.ADMIN,
                "bureau_id": None,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "supervisor@aicte-demo.gov.in",
                "full_name": "Dr. Ramesh Chandra (Supervisor)",
                "role": UserRole.SUPERVISOR,
                "bureau_id": None,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "officer.appr@aicte-demo.gov.in",
                "full_name": "Shri Arvind Verma (Officer - Approval)",
                "role": UserRole.OFFICER,
                "bureau_id": bureau_map["APPR"].id,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "officer.stu@aicte-demo.gov.in",
                "full_name": "Dr. Priya Nair (Officer - Student Welfare)",
                "role": UserRole.OFFICER,
                "bureau_id": bureau_map["STU"].id,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "officer.fdc@aicte-demo.gov.in",
                "full_name": "Prof. Manoj Joshi (Officer - Faculty Grievance)",
                "role": UserRole.OFFICER,
                "bureau_id": bureau_map["FDC"].id,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "officer.fin@aicte-demo.gov.in",
                "full_name": "Shri Deepesh Goyal (Officer - Finance)",
                "role": UserRole.OFFICER,
                "bureau_id": bureau_map["FIN"].id,
                "hashed_password": "demo_hashed_password"
            },
            {
                "email": "auditor@aicte-demo.gov.in",
                "full_name": "CA Ananya Iyer (Auditor)",
                "role": UserRole.AUDITOR,
                "bureau_id": None,
                "hashed_password": "demo_hashed_password"
            },
        ]
        user_map = {}
        for u_data in users_data:
            user = User(**u_data)
            db.add(user)
            user_map[u_data["email"]] = user
        db.flush()

        print("Seeding SLA Policies...")
        sla_policies_data = [
            {
                "category": "Ragging & Student Harassment",
                "priority": CasePriority.URGENT,
                "resolution_hours": 48,
                "warning_threshold_hours": 12,
            },
            {
                "category": "Unauthorized Fee Demands",
                "priority": CasePriority.HIGH,
                "resolution_hours": 168,
                "warning_threshold_hours": 48,
            },
            {
                "category": "Withholding of Original Certificates",
                "priority": CasePriority.HIGH,
                "resolution_hours": 96,
                "warning_threshold_hours": 24,
            },
            {
                "category": "Faculty Salary Arrears",
                "priority": CasePriority.MEDIUM,
                "resolution_hours": 336,
                "warning_threshold_hours": 72,
            },
            {
                "category": "Infrastructure Misrepresentation",
                "priority": CasePriority.MEDIUM,
                "resolution_hours": 504,
                "warning_threshold_hours": 96,
            },
            {
                "category": "General Administrative Inquiries",
                "priority": CasePriority.LOW,
                "resolution_hours": 504,
                "warning_threshold_hours": 96,
            },
        ]
        sla_map = {}
        for s_data in sla_policies_data:
            policy = SLAPolicy(**s_data)
            db.add(policy)
            sla_map[s_data["category"]] = policy
        db.flush()

        print("Seeding Synthetic Institutions...")
        institutions_data = [
            ("1-10293811", "Bharati Institute of Technology & Science", "Maharashtra", "Pune", "Private"),
            ("1-10293812", "Sahyadri Engineering College", "Karnataka", "Mangaluru", "Autonomous"),
            ("1-10293813", "Vellore Metropolitan Technical Institute", "Tamil Nadu", "Vellore", "Private"),
            ("1-10293814", "Avadh Institute of Engineering & Research", "Uttar Pradesh", "Lucknow", "Private"),
            ("1-10293815", "Indraprastha Regional Polytechnic", "Delhi", "New Delhi", "Govt Aided"),
            ("1-10293816", "Deccan Institute of Pharmacy & Tech", "Telangana", "Hyderabad", "Private"),
            ("1-10293817", "Gujarat Coastal Engineering Academy", "Gujarat", "Surat", "Autonomous"),
            ("1-10293818", "Bengal Premier Institute of Management", "West Bengal", "Kolkata", "Private"),
            ("1-10293819", "Malwa Institute of Science & Technology", "Madhya Pradesh", "Indore", "Private"),
            ("1-10293820", "Thiruvalluvar College of Engineering", "Tamil Nadu", "Chennai", "Private"),
            ("1-10293821", "Jaipur Technical & Professional University", "Rajasthan", "Jaipur", "Private"),
            ("1-10293822", "Kalinga Institute of Polytechnic Studies", "Odisha", "Bhubaneswar", "Govt"),
            ("1-10293823", "Godavari Rural Engineering College", "Andhra Pradesh", "Rajahmundry", "Private"),
            ("1-10293824", "Patliputra Technological Institute", "Bihar", "Patna", "Autonomous"),
            ("1-10293825", "Himalayan Institute of Applied Technology", "Uttarakhand", "Dehradun", "Private"),
        ]
        institutions = []
        for pid, name, st, dist, itype in institutions_data:
            inst = Institution(
                aicte_permanent_id=pid,
                name=name,
                state=st,
                district=dist,
                institution_type=itype
            )
            db.add(inst)
            institutions.append(inst)
        db.flush()

        print("Seeding 58 Synthetic Complaint Cases & Timeline Events...")
        complaint_templates = [
            {
                "category": "Unauthorized Fee Demands",
                "priority": CasePriority.HIGH,
                "bureau_code": "FIN",
                "subjects": [
                    "Demand of unapproved capitation fee for B.Tech admission",
                    "Forced donation demanded under building fund category",
                    "Tuition fee hike exceeding state fee regulatory limits",
                    "Hostel fee charged during mandatory online semester",
                    "Exam fee demanded multiple times without receipt"
                ],
                "desc_template": "The student was admitted under government quota but the management demanded Rs {amt} under the guise of miscellaneous laboratory charges without providing an official fee receipt."
            },
            {
                "category": "Withholding of Original Certificates",
                "priority": CasePriority.HIGH,
                "bureau_code": "FIN",
                "subjects": [
                    "Retention of 10th and 12th original marksheets upon admission cancellation",
                    "Degree certificate withheld due to dispute over transport fee",
                    "Migration certificate refused after course completion",
                    "Original school leaving certificate not returned",
                    "Transfer certificate conditional on paying full 4-year fees"
                ],
                "desc_template": "Complainant withdrew admission within the prescribed AICTE cutoff window. However, the registrar has withheld original certificates demanding advance payment."
            },
            {
                "category": "Ragging & Student Harassment",
                "priority": CasePriority.URGENT,
                "bureau_code": "STU",
                "subjects": [
                    "Severe physical ragging incident in senior boys hostel",
                    "Verbal abuse and bullying by senior batch in campus canteen",
                    "Anti-ragging committee non-responsive after formal complaint",
                    "First-year students forced to perform late night chores",
                    "Cyber-bullying in departmental WhatsApp group"
                ],
                "desc_template": "Complainant reported repeated intimidation and humiliation in hostel block C. Despite written representation to the warden, no FIR or disciplinary action was initiated."
            },
            {
                "category": "Faculty Salary Arrears",
                "priority": CasePriority.MEDIUM,
                "bureau_code": "FDC",
                "subjects": [
                    "Assistant professors salary unpaid for 5 consecutive months",
                    "Provident fund deductions not deposited with EPFO",
                    "7th Pay Commission scale not implemented despite council mandates",
                    "Forced resignation demanded from senior ad-hoc lecturers",
                    "Arbitrary salary deductions without pay-slip explanation"
                ],
                "desc_template": "Teaching faculty in Electronics department have not received monthly stipends since August. Letters to the governing body have elicited no response."
            },
            {
                "category": "Infrastructure Misrepresentation",
                "priority": CasePriority.MEDIUM,
                "bureau_code": "APPR",
                "subjects": [
                    "Computer science lab lacking required systems and licenses",
                    "Non-existent library titles and missing journal subscriptions",
                    "Inadequate fire safety and emergency exits in workshop wing",
                    "Unapproved additional shift running in mechanical block",
                    "Rented premises operated without AICTE site clearance"
                ],
                "desc_template": "Inspection report claimed 120 high-end workstations; physically only 25 obsolete machines are installed, causing severe academic detriment."
            },
            {
                "category": "General Administrative Inquiries",
                "priority": CasePriority.LOW,
                "bureau_code": "APPR",
                "subjects": [
                    "Discrepancy in sanctioned student intake on council portal",
                    "Delay in issuing duplicate diploma certificate",
                    "Inquiry regarding accreditation validity period",
                    "Clarification needed on lateral entry eligibility criteria",
                    "Grievance redressal committee composition non-compliant"
                ],
                "desc_template": "Institutional portal displays 180 sanctioned seats whereas approval letter authorized only 120. Clarification requested from AICTE regional office."
            }
        ]

        now = datetime.now(timezone.utc)
        statuses = [
            CaseStatus.RECEIVED,
            CaseStatus.REGISTERED,
            CaseStatus.UNDER_TRIAGE,
            CaseStatus.ASSIGNED,
            CaseStatus.IN_PROGRESS,
            CaseStatus.AWAITING_INFORMATION,
            CaseStatus.UNDER_REVIEW,
            CaseStatus.RESOLVED,
            CaseStatus.CLOSED,
        ]

        # Officer map for assignment
        officer_by_bureau = {
            "APPR": user_map["officer.appr@aicte-demo.gov.in"],
            "STU": user_map["officer.stu@aicte-demo.gov.in"],
            "FDC": user_map["officer.fdc@aicte-demo.gov.in"],
            "FIN": user_map["officer.fin@aicte-demo.gov.in"],
        }

        total_cases_seeded = 0
        overdue_count = 0
        approaching_count = 0

        for i in range(1, 59):
            ref_id = f"AICTE-2026-{1000 + i}"
            inst = institutions[(i - 1) % len(institutions)]
            tmpl = complaint_templates[(i - 1) % len(complaint_templates)]
            bureau = bureau_map[tmpl["bureau_code"]]
            officer = officer_by_bureau[tmpl["bureau_code"]]
            policy = sla_map.get(tmpl["category"])

            subject = random.choice(tmpl["subjects"])
            desc = tmpl["desc_template"].format(amt=random.choice([25000, 50000, 75000, 120000]))

            # Distribute statuses deterministically
            status = statuses[(i - 1) % len(statuses)]

            # Configure SLA dates
            # Make first 4 cases Overdue
            if i <= 4:
                created_at = now - timedelta(days=20)
                due_date = now - timedelta(days=random.randint(1, 5))
                escalation = 2
                overdue_count += 1
            # Make next 6 cases Approaching Deadline (< 48h)
            elif 5 <= i <= 10:
                created_at = now - timedelta(days=5)
                due_date = now + timedelta(hours=random.randint(4, 40))
                escalation = 1
                approaching_count += 1
            # Normal future cases
            else:
                created_at = now - timedelta(days=random.randint(1, 14))
                due_date = created_at + timedelta(hours=policy.resolution_hours if policy else 168)
                escalation = 0

            resolved_at = None
            closed_at = None
            closure_remarks = None
            if status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]:
                resolved_at = created_at + timedelta(days=3)
                closure_remarks = "Grievance resolved following institutional compliance report and refund receipt confirmation."
            if status == CaseStatus.CLOSED:
                closed_at = resolved_at + timedelta(days=1)

            assigned_officer_id = officer.id if status not in [CaseStatus.RECEIVED, CaseStatus.REGISTERED] else None

            case = ComplaintCase(
                case_reference_id=ref_id,
                institution_id=inst.id,
                bureau_id=bureau.id,
                assigned_officer_id=assigned_officer_id,
                subject=subject,
                description_redacted=desc,
                description_confidential=f"[CONFIDENTIAL COMPLAINANT STATEMENT]: Complainant identity protected. Grievance filed against administration of {inst.name}.",
                category=tmpl["category"],
                priority=tmpl["priority"],
                status=status,
                sla_policy_id=policy.id if policy else None,
                due_date=due_date,
                escalation_level=escalation,
                closure_remarks=closure_remarks,
                created_at=created_at,
                updated_at=now,
                resolved_at=resolved_at,
                closed_at=closed_at
            )
            db.add(case)
            db.flush()

            # Add registration audit event
            db.add(CaseAuditEvent(
                case_id=case.id,
                actor_id=user_map["admin@aicte-demo.gov.in"].id,
                actor_role="ADMIN",
                event_type=AuditEventType.REGISTERED,
                previous_state=None,
                new_state=CaseStatus.RECEIVED.value,
                metadata_json={"channel": "Web Portal", "batch_id": "INIT-2026"},
                timestamp=created_at
            ))

            # Add lifecycle progression audit events
            if status != CaseStatus.RECEIVED:
                db.add(CaseAuditEvent(
                    case_id=case.id,
                    actor_id=user_map["supervisor@aicte-demo.gov.in"].id,
                    actor_role="SUPERVISOR",
                    event_type=AuditEventType.STATUS_CHANGE,
                    previous_state=CaseStatus.RECEIVED.value,
                    new_state=status.value,
                    metadata_json={"remarks": f"Transitioned to {status.value} during grievance review"},
                    timestamp=created_at + timedelta(hours=6)
                ))

            # Add assignment history if assigned
            if assigned_officer_id:
                db.add(CaseAssignmentHistory(
                    case_id=case.id,
                    from_bureau_id=None,
                    to_bureau_id=bureau.id,
                    assigned_by_id=user_map["supervisor@aicte-demo.gov.in"].id,
                    transfer_reason=f"Jurisdiction assigned to {bureau.name} based on complaint category {tmpl['category']}",
                    created_at=created_at + timedelta(hours=4)
                ))

            # Add an internal note for cases in progress or review
            if status in [CaseStatus.IN_PROGRESS, CaseStatus.UNDER_REVIEW, CaseStatus.AWAITING_INFORMATION]:
                db.add(CaseNote(
                    case_id=case.id,
                    author_id=officer.id,
                    content=f"Formal inquiry notice dispatched to Registrar of {inst.name}. Response pending within 7 working days.",
                    is_confidential=False,
                    created_at=created_at + timedelta(hours=12)
                ))

            total_cases_seeded += 1

        db.commit()
        print(f"Database successfully seeded with:")
        print(f"  - {len(bureaus_data)} Bureaus")
        print(f"  - {len(users_data)} Users")
        print(f"  - {len(institutions_data)} Institutions")
        print(f"  - {len(sla_policies_data)} SLA Policies")
        print(f"  - {total_cases_seeded} Complaint Cases (Overdue: {overdue_count}, Approaching: {approaching_count})")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_database()
