import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { GraduationCap, ShieldCheck, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'candidate' | 'admin'>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) throw new Error("Firebase not initialized. Please update firebaseConfig.");
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // We could save the role to Firestore here, but keeping it simple for now
      }
      
      // Store role locally so we know where to route them
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', email);
      
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Firebase not initialized') || err.message.includes('API_KEY')) {
        setError('Firebase is not configured! Please update src/firebase.ts with your credentials to login.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: 450, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        
        {/* Logo Placeholder */}
        <div style={{ 
          width: 80, height: 80, backgroundColor: 'var(--cu-red)', borderRadius: '50%', 
          margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(179,33,40,0.3)'
        }}>
          <ShieldCheck color="white" size={40} />
        </div>
        
        <h1 style={{ marginBottom: '0.5rem' }}>CU Health Informatics</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {isLogin ? 'Sign in to continue' : 'Create a new account'}
        </p>

        {error && (
          <div style={{ backgroundColor: 'var(--bg-needs-improvement)', color: 'var(--cu-red)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => setRole('candidate')}
            className={`btn ${role === 'candidate' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            <GraduationCap size={18} /> Candidate
          </button>
          <button 
            type="button"
            onClick={() => setRole('admin')}
            className={`btn ${role === 'admin' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            <ShieldCheck size={18} /> Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="you@centraluni.edu" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
                required 
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 40 }}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem', fontSize: '1.1rem', padding: '12px' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--cu-red)', fontWeight: 600, cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
