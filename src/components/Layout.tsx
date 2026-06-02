import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        backgroundColor: 'var(--cu-red)', 
        color: 'white', 
        padding: '1rem 2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} />
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>CU Health Informatics</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
            {role === 'admin' ? 'Administrator' : 'Candidate'}
          </span>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, backgroundColor: 'var(--bg-color)' }}>
        <Outlet />
      </main>
    </div>
  );
}
