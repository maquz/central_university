import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDoc, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { GraduationCap, ShieldCheck, Mail, Lock, AlertCircle, Hash, Users } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'candidate' | 'admin'>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const verifyCandidateIndex = async () => {
    try {
      if (db) {
        const docSnap = await getDoc(doc(db, 'candidates', email));
        if (docSnap.exists() && docSnap.data().indexNumber === indexNumber) {
          return true;
        }
        return false;
      }
    } catch (e) {}
    
    // Local fallback
    const local = JSON.parse(localStorage.getItem('candidates') || '[]');
    const found = local.find((c: any) => c.email === email && c.indexNumber === indexNumber);
    return !!found;
  };

  const checkAdminStatus = async (userEmail: string) => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'admins'));
        if (snapshot.empty) return { status: 'approved', level: 'admin' };
        
        const docSnap = await getDoc(doc(db, 'admins', userEmail));
        if (docSnap.exists()) {
          return { status: docSnap.data().status, level: docSnap.data().level || 'editor' };
        }
      }
    } catch (e) {}
    
    // Local fallback
    const local = JSON.parse(localStorage.getItem('admins') || '[]');
    const found = local.find((a: any) => a.email === userEmail);
    // If no existing admin at all, auto-approve the first one for bootstrapping
    if (local.length === 0) return { status: 'approved', level: 'admin' };
    return found ? { status: found.status, level: found.level || 'editor' } : { status: 'not_found', level: 'editor' };
  };

  const registerAdmin = async (userEmail: string) => {
    let status = 'pending';
    let local = JSON.parse(localStorage.getItem('admins') || '[]');
    
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'admins'));
        if (snapshot.empty) status = 'approved';
      }
    } catch(e) {
      if (local.length === 0) status = 'approved';
    }

    const newAdmin = { email: userEmail, status, level: status === 'approved' ? 'admin' : 'editor' };
    
    try {
      if (db) await setDoc(doc(db, 'admins', userEmail), newAdmin);
    } catch(e) {}

    const filtered = local.filter((a: any) => a.email !== userEmail);
    localStorage.setItem('admins', JSON.stringify([...filtered, newAdmin]));

    return status;
  };

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
        // Option A: Auto-register candidate details upon sign up
        if (role === 'candidate' && db) {
          await setDoc(doc(db, 'candidates', email), {
            id: email,
            email,
            indexNumber
          });
        }
      }

      if (role === 'candidate') {
        const isValidIndex = await verifyCandidateIndex();
        if (!isValidIndex) {
          await signOut(auth);
          throw new Error('Invalid Candidate Email or Index Number. Please contact your administrator.');
        }
      }
      
      if (role === 'admin') {
        if (!isLogin) {
          const status = await registerAdmin(email);
          if (status === 'pending') {
            throw new Error('Admin registration successful. Your account is pending approval by an existing Admin.');
          }
          localStorage.setItem('staffLevel', 'admin');
        } else {
          const result = await checkAdminStatus(email);
          if (result.status === 'pending') {
            throw new Error('Your admin account is still pending approval.');
          }
          if (result.status === 'not_found' && !isLogin) {
            // Should not happen as we just registered
          } else if (result.status === 'not_found' && isLogin) {
            // Maybe they registered before we added this logic. We'll auto-approve for backwards compatibility in demo.
            await registerAdmin(email);
            localStorage.setItem('staffLevel', 'admin');
          } else {
            localStorage.setItem('staffLevel', result.level);
          }
        }
      }

      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', email);
      
      if (role === 'admin') {
        const level = localStorage.getItem('staffLevel');
        navigate(level === 'admin' ? '/admin' : '/editor');
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Firebase not initialized') || err.message.includes('API_KEY')) {
        setError('Firebase is not configured! Please update src/firebase.ts with your credentials to login.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed');
      }
      
      // Clear localStorage if we failed after auth
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: 450, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        
        <div style={{ margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="CU Health Informatics" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
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
            <Users size={18} /> Staff
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

          {role === 'candidate' && (
            <div className="form-group">
              <label className="form-label">Index Number</label>
              <div style={{ position: 'relative' }}>
                <Hash size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. CU10001" 
                  value={indexNumber}
                  onChange={e => setIndexNumber(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  required 
                />
              </div>
            </div>
          )}
          
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
