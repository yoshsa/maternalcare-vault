const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MaternalCareVault", function () {
  let vault, owner, doctor, midwife, patient, unauthorizedUser;

  const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Midwife: 3,
    Admin: 4
  };

  beforeEach(async function () {
    [owner, doctor, midwife, patient, unauthorizedUser] = await ethers.getSigners();

    const VaultFactory = await ethers.getContractFactory("MaternalCareVault");
    vault = await VaultFactory.deploy();
    await vault.waitForDeployment();
  });

  describe("Provider Registration & Verification", function () {
    it("should allow a doctor to register and require admin verification", async function () {
      await vault.connect(doctor).registerProvider("Dr. Jane Doe", "MED-12345", Role.Doctor);
      const prov = await vault.providers(doctor.address);
      expect(prov.name).to.equal("Dr. Jane Doe");
      expect(prov.licenseNumber).to.equal("MED-12345");
      expect(prov.role).to.equal(Role.Doctor);
      expect(prov.isVerified).to.be.false;

      // Verify provider by admin
      await vault.connect(owner).setProviderVerification(doctor.address, true);
      const updated = await vault.providers(doctor.address);
      expect(updated.isVerified).to.be.true;
    });

    it("should reject non-admin from verifying a provider", async function () {
      await vault.connect(doctor).registerProvider("Dr. Jane Doe", "MED-12345", Role.Doctor);
      await expect(
        vault.connect(unauthorizedUser).setProviderVerification(doctor.address, true)
      ).to.be.revertedWith("Vault: Caller is not the contract owner");
    });
  });

  describe("Access Control & Delegation", function () {
    beforeEach(async function () {
      // Register and verify doctor
      await vault.connect(doctor).registerProvider("Dr. Jane Doe", "MED-12345", Role.Doctor);
      await vault.connect(owner).setProviderVerification(doctor.address, true);
    });

    it("should grant time-bound access to a verified doctor", async function () {
      // Grant access for 3600 seconds (1 hour)
      await vault.connect(patient).grantAccess(doctor.address, 3600);
      const hasAccess = await vault.hasActiveAccess(patient.address, doctor.address);
      expect(hasAccess).to.be.true;
    });

    it("should allow a patient to revoke access immediately", async function () {
      await vault.connect(patient).grantAccess(doctor.address, 3600);
      await vault.connect(patient).revokeAccess(doctor.address);

      const hasAccess = await vault.hasActiveAccess(patient.address, doctor.address);
      expect(hasAccess).to.be.false;
    });

    it("should deny access to unverified providers", async function () {
      await vault.connect(midwife).registerProvider("Nurse Mary", "NUR-9999", Role.Midwife);
      // Attempting to grant access before admin verification
      await expect(
        vault.connect(patient).grantAccess(midwife.address, 3600)
      ).to.be.revertedWith("Vault: Target provider is not verified");
    });
  });

  describe("Record Creation & Integrity", function () {
    const mockCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const mockHash = ethers.keccak256(ethers.toUtf8Bytes("encrypted-record-payload"));

    beforeEach(async function () {
      await vault.connect(doctor).registerProvider("Dr. Jane Doe", "MED-12345", Role.Doctor);
      await vault.connect(owner).setProviderVerification(doctor.address, true);
    });

    it("should allow the patient to add their own record", async function () {
      await vault.connect(patient).addRecord(patient.address, mockCID, mockHash, "Prenatal Vitals");
      const records = await vault.connect(patient).getRecords(patient.address);

      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("Prenatal Vitals");
      expect(records[0].ipfsCID).to.equal(mockCID);
      expect(records[0].recordedBy).to.equal(patient.address);
    });

    it("should allow an authorized doctor to add records for the patient", async function () {
      await vault.connect(patient).grantAccess(doctor.address, 3600);
      await vault.connect(doctor).addRecord(patient.address, mockCID, mockHash, "Fetal Ultrasound Scan");

      const records = await vault.connect(patient).getRecords(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("Fetal Ultrasound Scan");
      expect(records[0].recordedBy).to.equal(doctor.address);
    });

    it("should prevent unauthorized actors from reading patient records", async function () {
      await vault.connect(patient).addRecord(patient.address, mockCID, mockHash, "Sensitive Medical History");

      await expect(
        vault.connect(unauthorizedUser).getRecords(patient.address)
      ).to.be.revertedWith("Vault: Access denied or expired");
    });
  });
});
