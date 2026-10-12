import React, { useState } from 'react';

// Example React component showing integration with Wagmi / Viem for MaternalCareVault
export const PatientDashboard: React.FC = () => {
  const [patientRecords, setPatientRecords] = useState([
    {
      id: 0,
      type: 'Prenatal Vitals & Blood Pressure',
      cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
      timestamp: '2026-10-10 14:30',
      recordedBy: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Dr. Jane Doe)'
    },
    {
      id: 1,
      type: 'Fetal Heart Rate & Doppler Scan',
      cid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
      timestamp: '2026-10-12 10:15',
      recordedBy: '0x90F79bf6EB2c4f870365E785982E1f101E93b906 (Patient Self-Report)'
    }
  ]);

  const [providerAddress, setProviderAddress] = useState('');
  const [accessDuration, setAccessDuration] = useState('86400'); // 24 hours in seconds
  const [grantStatus, setGrantStatus] = useState<string | null>(null);

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerAddress) return;
    setGrantStatus(`Access successfully delegated to ${providerAddress.slice(0, 8)}... for ${Number(accessDuration)/3600} hours`);
    setProviderAddress('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <header style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ color: '#0f766e', margin: 0, fontSize: '24px' }}>MaternalCare Vault</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
          Decentralized, Patient-Governed Maternal Electronic Health Records (EHR)
        </p>
      </header>

      {/* Grant Access Section */}
      <section style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#111827' }}>Delegate Clinical Record Access</h2>
        <form onSubmit={handleGrantAccess} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Doctor / Midwife Ethereum Address (0x...)"
            value={providerAddress}
            onChange={(e) => setProviderAddress(e.target.value)}
            style={{ flex: 1, minWidth: '280px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <select
            value={accessDuration}
            onChange={(e) => setAccessDuration(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff' }}
          >
            <option value="3600">1 Hour (Consultation)</option>
            <option value="86400">24 Hours (Daily Review)</option>
            <option value="604800">7 Days (Weekly Followup)</option>
          </select>
          <button
            type="submit"
            style={{ background: '#0f766e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Grant Access
          </button>
        </form>
        {grantStatus && (
          <p style={{ marginTop: '12px', color: '#047857', fontSize: '14px', background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px' }}>
            ✓ {grantStatus}
          </p>
        )}
      </section>

      {/* Health Records Display */}
      <section style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#111827' }}>Encrypted Patient Records</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {patientRecords.map((rec) => (
            <div key={rec.id} style={{ padding: '14px', border: '1px solid #f3f4f6', borderRadius: '6px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{rec.type}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{rec.timestamp}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', wordBreak: 'break-all' }}>
                <strong>IPFS CID:</strong> <code>{rec.cid}</code>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Recorded by: {rec.recordedBy}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PatientDashboard;
