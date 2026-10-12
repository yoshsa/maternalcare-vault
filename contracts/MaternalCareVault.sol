// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MaternalCareVault
 * @author Yohan Samuditha
 * @notice Decentralized, patient-controlled maternal health record registry (EHR).
 * @dev Manages encrypted off-chain IPFS document CIDs, role-based access, and time-bound provider permissions.
 */
contract MaternalCareVault {
    // --- Roles ---
    enum Role { None, Patient, Doctor, Midwife, Admin }

    struct Provider {
        string name;
        string licenseNumber;
        Role role; // Doctor or Midwife
        bool isVerified;
    }

    struct Record {
        uint256 recordId;
        string ipfsCID;        // Encrypted IPFS content identifier
        bytes32 dataHash;       // SHA-256 integrity hash of encrypted payload
        string recordType;     // e.g., "Prenatal Vitals", "Ultrasound", "Lab Results"
        uint256 timestamp;
        address recordedBy;    // Doctor, Midwife, or Patient
    }

    struct AccessPermission {
        bool hasAccess;
        uint256 expiresAt;     // Timestamp expiration (0 means revoked)
    }

    // --- State Variables ---
    address public immutable owner;

    // Mapping: provider address => Provider profile
    mapping(address => Provider) public providers;

    // Mapping: patient address => list of medical records
    mapping(address => Record[]) private patientRecords;

    // Mapping: patient => provider => AccessPermission
    mapping(address => mapping(address => AccessPermission)) public patientAccess;

    // --- Events ---
    event ProviderRegistered(address indexed providerAddress, string name, Role role);
    event ProviderVerified(address indexed providerAddress, bool status);
    event RecordAdded(address indexed patient, uint256 indexed recordId, string recordType, string ipfsCID, address indexed recordedBy);
    event AccessGranted(address indexed patient, address indexed provider, uint256 expiresAt);
    event AccessRevoked(address indexed patient, address indexed provider);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: Caller is not the contract owner");
        _;
    }

    modifier onlyVerifiedProvider() {
        require(providers[msg.sender].isVerified, "Vault: Caller is not a verified medical provider");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Provider Management ---

    /**
     * @notice Register a healthcare provider (Doctor or Midwife)
     * @param _name Full name of the medical practitioner
     * @param _licenseNumber Institutional medical license identifier
     * @param _role Must be either Role.Doctor or Role.Midwife
     */
    function registerProvider(string calldata _name, string calldata _licenseNumber, Role _role) external {
        require(_role == Role.Doctor || _role == Role.Midwife, "Vault: Invalid provider role");
        require(providers[msg.sender].role == Role.None, "Vault: Provider already registered");

        providers[msg.sender] = Provider({
            name: _name,
            licenseNumber: _licenseNumber,
            role: _role,
            isVerified: false // Requires admin verification
        });

        emit ProviderRegistered(msg.sender, _name, _role);
    }

    /**
     * @notice Admin approves/verifies medical provider credentials
     */
    function setProviderVerification(address _provider, bool _status) external onlyOwner {
        require(providers[_provider].role != Role.None, "Vault: Provider not registered");
        providers[_provider].isVerified = _status;
        emit ProviderVerified(_provider, _status);
    }

    // --- Patient Access Control ---

    /**
     * @notice Grant temporary or indefinite access to a medical provider
     * @param _provider Address of doctor or midwife
     * @param _durationSeconds Duration in seconds (pass 0 for indefinite access)
     */
    function grantAccess(address _provider, uint256 _durationSeconds) external {
        require(providers[_provider].isVerified, "Vault: Target provider is not verified");
        require(_provider != msg.sender, "Vault: Cannot grant access to self");

        uint256 expiresAt = _durationSeconds > 0 ? block.timestamp + _durationSeconds : type(uint256).max;
        patientAccess[msg.sender][_provider] = AccessPermission({
            hasAccess: true,
            expiresAt: expiresAt
        });

        emit AccessGranted(msg.sender, _provider, expiresAt);
    }

    /**
     * @notice Revoke access from a medical provider immediately
     */
    function revokeAccess(address _provider) external {
        delete patientAccess[msg.sender][_provider];
        emit AccessRevoked(msg.sender, _provider);
    }

    /**
     * @notice Check if a provider currently has valid read access to patient records
     */
    function hasActiveAccess(address _patient, address _provider) public view returns (bool) {
        if (_patient == _provider) return true;
        AccessPermission memory permission = patientAccess[_patient][_provider];
        return permission.hasAccess && block.timestamp <= permission.expiresAt;
    }

    // --- Record Management ---

    /**
     * @notice Add an encrypted health record for a patient
     * @dev Can be invoked by the patient directly or by an authorized, verified provider
     * @param _patient Address of the patient receiving the record
     * @param _ipfsCID IPFS hash where encrypted record resides
     * @param _dataHash Hash verifying payload integrity
     * @param _recordType Type of record (e.g. Vitals, Ultrasound, Blood Test)
     */
    function addRecord(
        address _patient,
        string calldata _ipfsCID,
        bytes32 _dataHash,
        string calldata _recordType
    ) external {
        if (msg.sender != _patient) {
            require(hasActiveAccess(_patient, msg.sender), "Vault: Access denied");
            require(providers[msg.sender].isVerified, "Vault: Provider not verified");
        }

        uint256 newRecordId = patientRecords[_patient].length;
        patientRecords[_patient].push(Record({
            recordId: newRecordId,
            ipfsCID: _ipfsCID,
            dataHash: _dataHash,
            recordType: _recordType,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        }));

        emit RecordAdded(_patient, newRecordId, _recordType, _ipfsCID, msg.sender);
    }

    /**
     * @notice Retrieve all medical records for a patient
     * @dev Restricted to the patient or authorized providers with unexpired access
     */
    function getRecords(address _patient) external view returns (Record[] memory) {
        require(hasActiveAccess(_patient, msg.sender), "Vault: Access denied or expired");
        return patientRecords[_patient];
    }

    /**
     * @notice Get count of records for a patient
     */
    function getRecordCount(address _patient) external view returns (uint256) {
        require(hasActiveAccess(_patient, msg.sender), "Vault: Access denied");
        return patientRecords[_patient].length;
    }
}
