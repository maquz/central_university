import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, FileSpreadsheet, Activity, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ admins: 0, editors: 0, candidates: 0, quizzes: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
         if (db) {
            const adminSnap = await getDocs(collection(db, 'admins'));
            const admins = adminSnap.docs.filter(d => d.data().level === 'admin' && d.data().status === 'approved').length;
            const editors = adminSnap.docs.filter(d => d.data().level === 'editor' && d.data().status === 'approved').length;
            const candSnap = await getDocs(collection(db, 'candidates'));
            const candidates = candSnap.size;
            const quizSnap = await getDocs(collection(db, 'quizzes'));
            const quizzes = quizSnap.size;
            setStats({ admins, editors, candidates, quizzes });
         }
      } catch(e) {}
    };
    fetchStats();
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>System Admin Panel</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-outline" onClick={() => navigate('/editor')}>
             Go to Editor Panel <ArrowRight size={18} />
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/approvals')}>
            <ShieldAlert size={20} /> Manage Users & Roles
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" onClick={() => navigate('/admin/approvals')} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--cu-red)', padding: '12px', borderRadius: '12px', color: 'white' }}>
            <Activity size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.admins}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>System Admins</p>
          </div>
        </div>
        <div className="glass-panel" onClick={() => navigate('/admin/approvals')} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--cu-gold)', padding: '12px', borderRadius: '12px', color: 'white' }}>
            <Users size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.editors}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Editors</p>
          </div>
        </div>
        <div className="glass-panel" onClick={() => navigate('/editor/candidates')} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--color-average)', padding: '12px', borderRadius: '12px', color: 'white' }}>
            <Users size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.candidates}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Candidates</p>
          </div>
        </div>
        <div className="glass-panel" onClick={() => navigate('/editor')} style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ backgroundColor: 'var(--color-excellent)', padding: '12px', borderRadius: '12px', color: 'white' }}>
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.quizzes}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Quizzes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
