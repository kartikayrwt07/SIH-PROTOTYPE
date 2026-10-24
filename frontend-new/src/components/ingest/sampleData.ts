/**
 * Sample CSV template and test datasets for CSV Ingestion.
 * Expected columns: institution_aicte_id, bureau_code, subject, category, priority, description, is_confidential
 */

export const SAMPLE_CSV_HEADER = "institution_aicte_id,bureau_code,subject,category,priority,description,is_confidential";

/**
 * 14-row dataset: 12 valid rows across APPR, STU, FDC, FIN + 2 invalid rows.
 * Exactly matches SPEC §6: '12 valid, 2 invalid'.
 */
export const SAMPLE_CSV_CONTENT = `${SAMPLE_CSV_HEADER}
1-3324561,APPR,Shortage of accredited laboratories in Mechanical Dept,Approval Compliance,HIGH,Laboratories non-functional during current academic session,false
1-4521890,STU,Severe hostel ragging incident in boys wing,Student Grievance,URGENT,First-year students harassed by senior hostel residents without warden intervention,true
1-2893421,FDC,7th CPC pay commission arrears withheld for 8 months,Faculty Grievance,HIGH,Management refused revision of AICTE approved scales for assistant professors,false
2-7654321,FIN,Excess capitation fee demanded at time of counseling,Fee Regulation,MEDIUM,College collected 1.2 lakhs additional caution deposit with no receipt,false
1-5643210,APPR,Enrolled students exceed approved intake capacity,Approval Compliance,HIGH,Intake approved for 60 students but college admitted 110 students,false
1-8765432,STU,Substandard hostel food and contaminated drinking water,Student Grievance,MEDIUM,Mess facilities unhygienic with repeated food poisoning complaints,false
2-3456789,FDC,Unlawful termination of assistant professor without notice,Faculty Grievance,HIGH,Faculty terminated mid-semester without statutory inquiry committee,true
1-6789012,FIN,Withholding original 12th marksheets after withdrawal,Fee Regulation,HIGH,College refuses to return academic certificates after student took admission elsewhere,false
1-9876543,APPR,Deficient land and building built-up area for engineering college,Approval Compliance,MEDIUM,Physical infrastructure short by 2400 sq meters per AICTE handbook norms,false
2-1234567,STU,Lack of internal complaints committee for student safety,Student Grievance,HIGH,No mandatory POSH committee established on campus,true
1-7654321,FDC,Non-payment of provident fund contributions to EPFO,Faculty Grievance,MEDIUM,PF deductions made from faculty salary but not deposited for 11 months,false
1-4567890,FIN,Mandatory donation demand for hostel room allotment,Fee Regulation,LOW,Hostel warden requiring extra cash payment for single room allotment,false
INVALID-999,APPR,Invalid AICTE permanent ID format demonstration,Approval Compliance,HIGH,This row intentionally has an invalid AICTE ID format to test validation,false
2-8901234,UNKNOWN_BUR,Unknown bureau code demonstration,General,LOW,This row intentionally has an unknown bureau code to test error flagging,false`;

/** Download the sample CSV template directly to the user's browser */
export function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "aicte_complaint_intake_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
