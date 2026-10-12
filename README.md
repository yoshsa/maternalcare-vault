# 🏥 MaternalCare Vault

> **Decentralized, Patient-Governed Maternal Electronic Health Records (EHR)**  
> Built with Solidity, Hardhat, IPFS/Pinata, TypeScript, and React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue.svg)](https://soliditylang.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

---

## 💡 Overview

Maternal health systems often struggle with fragmented patient history between clinics, compromised patient data privacy, and lack of patient control over clinical data. 

**MaternalCare Vault** solves this through a decentralized, role-based Electronic Health Record (EHR) registry on Ethereum:
1. **Patient Sovereignty:** Patients explicitly grant and revoke time-bound access (e.g. 1 hour consultation, 7-day follow-up) to verified doctors and midwives.
2. **Confidentiality:** Vitals, ultrasound scans, and bloodwork are client-side encrypted before uploading to IPFS. Only the encrypted CID and cryptographic integrity hash (`bytes32`) reside on-chain.
3. **Role-Based Provider Verification:** Only administrative-verified doctors and midwives can record clinical data to the patient vault.

---

## 🏗️ Architecture

```
+-------------------------------------------------------------------+
|                         React Frontend                            |
|             (Patient Dashboard & Provider Portal)                 |
+-------------------------------------------------------------------+
             |                                       |
    (Sign Transactions / Queries)       (Encrypted Payload)
             v                                       v
+-----------------------------+          +-------------------------+
|     MaternalCareVault       |          |       IPFS / Pinata     |
|       (Smart Contract)      |          | (Encrypted EHR Payload) |
|  - Role-based Access (RBAC) |          +-------------------------+
|  - Time-bound Permissions   |
|  - On-chain Integrity Hash  |
+-----------------------------+
```

---

## ⚡ Key Features

- **Granular Time-Bound Access:** `grantAccess(provider, durationSeconds)` grants time-locked access, eliminating perpetual unauthorized access.
- **Provider Licensing Verification:** Doctors register with verifiable institutional license IDs; access rights only unlock after administrator verification.
- **Data Integrity Verification:** Each record stores an immutable `keccak256` hash of the original encrypted payload to detect off-chain tampering.

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/YOUR_USERNAME/maternalcare-vault.git
cd maternalcare-vault
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

### 3. Run Automated Test Suite

```bash
npx hardhat test
```

Expected output:
```text
  MaternalCareVault
    Provider Registration & Verification
      ✔ should allow a doctor to register and require admin verification
      ✔ should reject non-admin from verifying a provider
    Access Control & Delegation
      ✔ should grant time-bound access to a verified doctor
      ✔ should allow a patient to revoke access immediately
      ✔ should deny access to unverified providers
    Record Creation & Integrity
      ✔ should allow the patient to add their own record
      ✔ should allow an authorized doctor to add records for the patient
      ✔ should prevent unauthorized actors from reading patient records
```

---

## 🔒 Security & Privacy Considerations

- **Zero Cleartext PII On-Chain:** No patient names, phone numbers, or unencrypted biometric data are written to the blockchain.
- **Fail-Closed Access Control:** The contract defaults to denied access unless explicitly active and unexpired.
- **State Deletion on Revocation:** Revoking access resets state permissions immediately in `patientAccess`.

---

## 📄 License
Distributed under the MIT License.
