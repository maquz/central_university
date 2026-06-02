import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Edit2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface Candidate {
  id: string; // usually their email
  email: string;
  indexNumber: string;
}

export default function CandidateManagement() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const local = JSON.parse(localStorage.getItem('candidates') || '[]');
      setCandidates(local);
      if (db) {
        const snapshot = await getDocs(collection(db, 'candidates'));
        const fbCandidates = snapshot.docs.map(doc => doc.data() as Candidate);
        if (fbCandidates.length > 0) setCandidates(fbCandidates);
      }
    } catch (e) {
      console.warn("Using local fallback for candidates");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !indexNumber) return;
    
    setLoading(true);
    const newCandidate: Candidate = { id: email, email, indexNumber };
    
    try {
      if (db) {
        await setDoc(doc(db, 'candidates', email), newCandidate);
      } else {
        throw new Error("No DB");
      }
    } catch (err) {
      const existing = JSON.parse(localStorage.getItem('candidates') || '[]');
      const filtered = existing.filter((c: Candidate) => c.email !== email);
      localStorage.setItem('candidates', JSON.stringify([...filtered, newCandidate]));
    }
    
    setEmail('');
    setIndexNumber('');
    await fetchCandidates();
    setLoading(false);
  };

  const handleBulkUpload = async () => {
    if (!bulkData) return;
    setLoading(true);
    
    const lines = bulkData.split('\n');
    const newCandidates: Candidate[] = [];
    
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const e = parts[0].trim();
        const idx = parts[1].trim();
        if (e && idx) {
          newCandidates.push({ id: e, email: e, indexNumber: idx });
        }
      }
    }

    try {
      if (db) {
        // Run sequentially for simplicity, or Promise.all
        await Promise.all(newCandidates.map(c => setDoc(doc(db, 'candidates', c.email), c)));
      } else {
        throw new Error("No DB");
      }
    } catch (err) {
      // Local fallback mapping
      let existing = JSON.parse(localStorage.getItem('candidates') || '[]');
      // simple merge
      const merged = [...existing];
      newCandidates.forEach(nc => {
        const idx = merged.findIndex(c => c.email === nc.email);
        if (idx >= 0) merged[idx] = nc;
        else merged.push(nc);
      });
      localStorage.setItem('candidates', JSON.stringify(merged));
    }
    
    setBulkData('');
    await fetchCandidates();
    setLoading(false);
  };

  const handleDelete = async (candidateEmail: string) => {
    try {
      if (db) {
        await deleteDoc(doc(db, 'candidates', candidateEmail));
      } else {
        throw new Error("No DB");
      }
    } catch (err) {
      const existing = JSON.parse(localStorage.getItem('candidates') || '[]');
      localStorage.setItem('candidates', JSON.stringify(existing.filter((c: Candidate) => c.email !== candidateEmail)));
    }
    await fetchCandidates();
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
        <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/admin')}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>Candidate Management</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2rem' }}>
        {/* Add Single Candidate */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add/Edit Candidate</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Index Number</label>
              <input type="text" className="form-input" value={indexNumber} onChange={e => setIndexNumber(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Candidate'}
            </button>
          </form>
        </div>

        {/* Bulk Upload */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Bulk Upload (CSV format)</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Format: <code>email,index_number</code> (one per line)
          </p>
          <textarea 
            className="form-input" 
            style={{ height: '120px', resize: 'vertical', marginBottom: '1rem' }}
            placeholder="student1@centraluni.edu, CU10001&#10;student2@centraluni.edu, CU10002"
            value={bulkData}
            onChange={e => setBulkData(e.target.value)}
          />
          <button onClick={handleBulkUpload} className="btn btn-outline" disabled={loading || !bulkData.trim()} style={{ width: '100%' }}>
            <Upload size={18} /> {loading ? 'Uploading...' : 'Process Bulk Upload'}
          </button>
        </div>
      </div>

      {/* Candidate List */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Registered Candidates ({candidates.length})</h3>
        {candidates.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No candidates registered yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Index Number</th>
                  <th style={{ padding: '12px', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.email} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>{c.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: 'var(--bg-average)', color: 'var(--color-average)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        {c.indexNumber}
                      </span>
                    </td>
                    <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => { setEmail(c.email); setIndexNumber(c.indexNumber); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cu-gold)' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.email)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-needs-improvement)' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
