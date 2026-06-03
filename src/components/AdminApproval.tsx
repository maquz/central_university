import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function AdminApproval() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const local = JSON.parse(localStorage.getItem('admins') || '[]');
      setAdmins(local);
      if (db) {
        const snapshot = await getDocs(collection(db, 'admins'));
        const fbAdmins = snapshot.docs.map(doc => doc.data());
        if (fbAdmins.length > 0) setAdmins(fbAdmins);
      }
    } catch (e) {}
  };

  const handleAction = async (email: string, action: 'approved' | 'rejected') => {
    try {
      if (db) {
        if (action === 'rejected') {
          await deleteDoc(doc(db, 'admins', email));
        } else {
          await setDoc(doc(db, 'admins', email), { email, status: 'approved' });
        }
      }
    } catch(e) {}

    // local fallback
    let local = JSON.parse(localStorage.getItem('admins') || '[]');
    if (action === 'rejected') {
      local = local.filter((a: any) => a.email !== email);
    } else {
      const idx = local.findIndex((a: any) => a.email === email);
      if (idx >= 0) local[idx].status = 'approved';
    }
    localStorage.setItem('admins', JSON.stringify(local));

    fetchAdmins();
  };

  const pendingAdmins = admins.filter(a => a.status === 'pending');
  const approvedAdmins = admins.filter(a => a.status === 'approved');

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>Manage Admin Roles</h2>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--cu-red)' }}>Pending Approvals ({pendingAdmins.length})</h3>
        {pendingAdmins.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending admin requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pendingAdmins.map(admin => (
              <div key={admin.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{admin.email}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleAction(admin.email, 'approved')} className="btn btn-outline" style={{ borderColor: 'var(--color-excellent)', color: 'var(--color-excellent)', padding: '6px 12px' }}>
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => handleAction(admin.email, 'rejected')} className="btn btn-outline" style={{ borderColor: 'var(--color-needs-improvement)', color: 'var(--color-needs-improvement)', padding: '6px 12px' }}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Approved Admins ({approvedAdmins.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {approvedAdmins.map(admin => (
            <div key={admin.email} style={{ padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
              {admin.email}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
