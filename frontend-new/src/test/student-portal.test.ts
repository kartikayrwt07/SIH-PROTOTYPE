import { describe, expect, it } from "vitest";
import {
  sendStudentOtp,
  verifyStudentOtp,
  getStudentPortalData,
  uploadStudentCaseDocument,
} from "@/api/index";

describe("Student-Facing Web Dashboard & Document Upload", () => {
  it("dispatches OTP challenge and verifies student identity via e-KYC", async () => {
    const otpResp = await sendStudentOtp("9876543210", "Aarav Sharma");
    expect(otpResp.tx_ref).toBeTruthy();
    expect(otpResp.sandbox_otp).toBe("123456");

    const profile = await verifyStudentOtp(otpResp.tx_ref, "123456");
    expect(profile.full_name).toBe("Aarav Sharma");
    expect(profile.complainant_type).toBe("STUDENT");
    expect(profile.verification_token).toBeTruthy();
    expect(profile.is_whistleblower_shielded).toBe(true);
  });

  it("retrieves student grievances with active and action required counts", async () => {
    const portalData = await getStudentPortalData("MOCK_STUDENT_JWT_TOKEN");
    expect(portalData.complainant.full_name).toBe("Aarav Sharma");
    expect(portalData.cases.length).toBeGreaterThan(0);

    const awaitingCase = portalData.cases.find((c) => c.is_awaiting_information);
    expect(awaitingCase).toBeDefined();
    expect(awaitingCase?.status).toBe("Awaiting Information");
  });

  it("securely uploads requested document and advances case to In Progress", async () => {
    const portalData = await getStudentPortalData("MOCK_STUDENT_JWT_TOKEN");
    const awaitingCase = portalData.cases.find((c) => c.is_awaiting_information)!;
    expect(awaitingCase).toBeDefined();

    const mockFile = new File(["Simulated Tuition Fee Receipt"], "fee_challan_receipt.pdf", {
      type: "application/pdf",
    });

    const uploadRes = await uploadStudentCaseDocument(
      awaitingCase.case_reference_id,
      mockFile,
      "Official bank challan showing fee payment confirmation.",
      "MOCK_STUDENT_JWT_TOKEN",
    );

    expect(uploadRes.new_status).toBe("In Progress");
    expect(uploadRes.attachment.file_name).toBe("fee_challan_receipt.pdf");
    expect(uploadRes.message).toContain("securely uploaded");

    // Re-verify that portal data reflects the status update
    const updatedPortalData = await getStudentPortalData("MOCK_STUDENT_JWT_TOKEN");
    const updatedCase = updatedPortalData.cases.find(
      (c) => c.case_reference_id === awaitingCase.case_reference_id,
    );
    expect(updatedCase?.status).toBe("In Progress");
  });
});
